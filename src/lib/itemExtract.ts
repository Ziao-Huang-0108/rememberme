import { CATEGORIES, categoryOf, type CategoryId } from './categories'
import { app, auth, authErrorMessage, cloudReady } from './cloudbase'
import { todayString } from './expiry'

export interface ExtractedItemFields {
  name: string | null
  category: CategoryId | null
  location: string | null
  description: string | null
  note: string | null
  price: number | null
  purchaseDate: string | null
  expiryDate: string | null
}

const CATEGORY_IDS = CATEGORIES.map((c) => c.id)

function addMonths(date: string, months: number) {
  const [y, m, d] = date.split('-').map(Number)
  return todayString(new Date(y, m - 1 + months, d))
}

function isYmd(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function stripCodeFence(text: string) {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  return (fenced?.[1] ?? trimmed).trim()
}

/** 从模型回复里抠出第一个 JSON 对象 */
export function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = stripCodeFence(text)
  try {
    const direct = JSON.parse(cleaned) as unknown
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
      return direct as Record<string, unknown>
    }
  } catch {
    // fall through
  }
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('没有认出可用的物品信息，请换几句更清楚的话再试')
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('没有认出可用的物品信息，请换几句更清楚的话再试')
  }
  return parsed as Record<string, unknown>
}

export function normalizeExtracted(raw: Record<string, unknown>, today: string): ExtractedItemFields {
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : null
  const location = typeof raw.location === 'string' && raw.location.trim() ? raw.location.trim() : null
  const description =
    typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : null
  let note = typeof raw.note === 'string' && raw.note.trim() ? raw.note.trim() : null

  let category: CategoryId | null = null
  if (typeof raw.category === 'string' && raw.category.trim()) {
    const id = raw.category.trim()
    category = CATEGORY_IDS.includes(id as CategoryId) ? (id as CategoryId) : categoryOf(id).id
  }

  let price: number | null = null
  if (typeof raw.price === 'number' && Number.isFinite(raw.price) && raw.price >= 0) price = raw.price
  if (typeof raw.price === 'string' && raw.price.trim()) {
    const n = Number(raw.price)
    if (Number.isFinite(n) && n >= 0) price = n
  }

  const purchaseDate = isYmd(raw.purchaseDate) ? raw.purchaseDate : null
  let expiryDate = isYmd(raw.expiryDate) ? raw.expiryDate : null
  const productionDate = isYmd(raw.productionDate) ? raw.productionDate : null
  const shelfLifeMonths =
    typeof raw.shelfLifeMonths === 'number' && Number.isFinite(raw.shelfLifeMonths) && raw.shelfLifeMonths > 0
      ? Math.round(raw.shelfLifeMonths)
      : null

  if (!expiryDate && productionDate && shelfLifeMonths) {
    expiryDate = addMonths(productionDate, shelfLifeMonths)
  }
  // 只有保质期月数、没有生产日期：从今天起算（和手填快捷按钮一致）
  if (!expiryDate && !productionDate && shelfLifeMonths) {
    expiryDate = addMonths(today, shelfLifeMonths)
  }

  if (!note && typeof raw.rawNote === 'string' && raw.rawNote.trim()) {
    note = raw.rawNote.trim()
  }

  return { name, category, location, description, note, price, purchaseDate, expiryDate }
}

export type FormSnapshot = {
  name: string
  category: string
  location: string
  description: string
  note: string
  priceText: string
  purchaseDate: string | null
  expiryDate: string | null
}

/** 只填空着的格子；返回合并后的表单与改动了的字段名 */
export function mergeExtractedIntoForm(
  form: FormSnapshot,
  extracted: ExtractedItemFields,
): { next: FormSnapshot; filled: string[] } {
  const next = { ...form }
  const filled: string[] = []
  const nameWasEmpty = !form.name.trim()

  if (nameWasEmpty && extracted.name) {
    next.name = extracted.name
    filled.push('名称')
  }
  // 名称本来就是空的（整单正在被 AI 填）时，才写入类别，避免改掉用户已选的分类
  if (nameWasEmpty && extracted.category) {
    next.category = extracted.category
    filled.push('类别')
  }
  if (!form.location.trim() && extracted.location) {
    next.location = extracted.location
    filled.push('放在哪')
  }
  if (!form.description.trim() && extracted.description) {
    next.description = extracted.description
    filled.push('用途')
  }
  if (!form.note.trim() && extracted.note) {
    next.note = extracted.note
    filled.push('备注')
  }
  if (!form.priceText.trim() && extracted.price != null) {
    next.priceText = String(extracted.price)
    filled.push('价格')
  }
  if (!form.purchaseDate && extracted.purchaseDate) {
    next.purchaseDate = extracted.purchaseDate
    filled.push('购买日期')
  }
  if (!form.expiryDate && extracted.expiryDate) {
    next.expiryDate = extracted.expiryDate
    filled.push('过期日期')
  }

  return { next, filled }
}

function buildPrompt(text: string, today: string, knownLocations: string[]) {
  const categoryList = CATEGORIES.map((c) => `${c.id}=${c.name}`).join('，')
  const locationHint =
    knownLocations.length > 0
      ? `家里已有位置（能对上就原样用）：${knownLocations.slice(0, 30).join('、')}`
      : '家里还没有常用位置列表。'
  return `你是家庭物品登记助手。今天是 ${today}。根据用户说的或包装上认出的文字，抽出物品信息。
只返回一个 JSON 对象，不要解释，不要 Markdown。字段：
{
  "name": 物品名称或 null,
  "category": 必须是这些 id 之一或 null（${categoryList}）,
  "location": 放置位置短句或 null,
  "description": 用途短句或 null（这是干什么的，例如退烧、洗碗；不要写过敏原或禁忌）,
  "note": 短备注或 null,
  "price": 数字或 null,
  "purchaseDate": "YYYY-MM-DD" 或 null,
  "expiryDate": "YYYY-MM-DD" 或 null,
  "productionDate": "YYYY-MM-DD" 或 null,
  "shelfLifeMonths": 保质期月数数字或 null,
  "rawNote": 拆不开但值得保留的原话或 null
}
规则：
- 不确定的字段用 null，不要编造。
- 若只有生产日期+保质期月数，填 productionDate 与 shelfLifeMonths，expiryDate 可留 null。
- 若只有「保质期 N 个月」且没有生产日期，填 shelfLifeMonths。
- note 只写短版提醒：过敏原（如有）+ 最多 1～2 条最要紧的注意事项（如需冷藏、忌与某药同服、孕妇慎用）。不要贴整段说明书，不要超过约 40 个汉字。
- description 与 note 分开：用途归 description，避坑提醒归 note。
- ${locationHint}

用户文字：
${text}`
}

export async function extractItemFromText(
  text: string,
  options: { today: string; knownLocations?: string[] },
): Promise<ExtractedItemFields> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('请先粘贴或输入一段文字')
  if (!cloudReady) throw new Error('还没连上云端，暂时不能自动填写')

  const current = await auth.getCurrentUser()
  if (!current) throw new Error('请先登录后再用自动填写')

  const ai = app.ai()
  const model = ai.createModel('cloudbase')
  let result: { text?: string; error?: unknown }
  try {
    result = await model.generateText({
      model: 'hy3',
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: buildPrompt(trimmed, options.today, options.knownLocations ?? []),
        },
      ],
    })
  } catch (err) {
    throw new Error(authErrorMessage(err) || '自动填写失败，请再试一次')
  }

  if (result.error) {
    throw new Error(authErrorMessage(result.error) || '自动填写失败，请再试一次')
  }
  const reply = (result.text || '').trim()
  if (!reply) throw new Error('没有得到分析结果，请再试一次')

  return normalizeExtracted(parseJsonObject(reply), options.today)
}
