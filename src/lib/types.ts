export interface ItemInput {
  name: string
  price: number | null
  description: string
  purchaseDate: string | null
  expiryDate: string | null
  location: string
  note: string
  photo: string | null
}

export interface Item extends ItemInput {
  id: string
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface ItemStore {
  list(): Promise<Item[]>
  save(input: ItemInput, id?: string): Promise<void>
  remove(id: string): Promise<void>
  /** 数据在别处（其他标签页、其他家人）被改动时回调，返回取消订阅函数 */
  subscribe(onChange: () => void): () => void
}

export const emptyInput: ItemInput = {
  name: '',
  price: null,
  description: '',
  purchaseDate: null,
  expiryDate: null,
  location: '',
  note: '',
  photo: null,
}
