const STORAGE_KEY = "remember-me:v1";

const state = {
  items: [],
  view: "ledger",
};

const emptyCopy = {
  ledger: {
    title: "还没有记下任何一笔",
    text: "买了东西就点「记一笔」。价钱、放在哪、什么时候过期，一次写完。",
  },
  place: {
    title: "还没有可找的东西",
    text: "记下房间、柜子和格子之后，这里会按位置把东西归在一起。",
  },
  status: {
    title: "还没有要盯的东西",
    text: "填了过期日期和使用频率之后，这里会用颜色标出该处理还是该补货。",
  },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.items)) state.items = data.items;
    if (data.view === "ledger" || data.view === "place" || data.view === "status") {
      state.view = data.view;
    }
  } catch (error) {
    console.error("本地数据读不出来", error);
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      view: state.view,
      items: state.items,
    }));
    return true;
  } catch (error) {
    console.error("本地数据写不进去", error);
    toast("浏览器存不下了。可以先导出备份，或删掉几张照片再试。");
    return false;
  }
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
}

function render() {
  document.querySelectorAll(".tab").forEach((button) => {
    const selected = button.dataset.view === state.view;
    button.setAttribute("aria-selected", selected ? "true" : "false");
  });
  const copy = emptyCopy[state.view];
  document.getElementById("main").innerHTML = `
    <section class="empty">
      <h2>${copy.title}</h2>
      <p>${copy.text}</p>
    </section>
  `;
}

function init() {
  load();
  document.querySelector(".tabs").addEventListener("click", (event) => {
    const button = event.target.closest(".tab");
    if (!button) return;
    state.view = button.dataset.view;
    save();
    render();
  });
  render();
}

init();
