export class Update {
  constructor(payload) {
    this.payload = payload;
  }
}
export class UpdateQueue {
  constructor() {
    this.firstUpdate = null;
    this.lastUpdate = null;
  }
  enqueueUpdate(update) {
    // 第一次调用 enqueueUpdate;
    if (this.lastUpdate == null) {
      this.firstUpdate = this.lastUpdate = update; // 将setState(payload),生成一个 update更新单项链表,
    } else {
      //第二次调用 setState,也就是第二次调用 enqueueUpdate
      this.lastUpdate.nextUpdate = update;
      this.lastUpdate = update;
    }
  }
  // 批量更新 state状态, forceUpdate(state)，参数state是组件里 state
  forceUpdate(state) {
    let currentUpdate = this.firstUpdate;
    while (currentUpdate) {
      let newState =
        typeof currentUpdate.payload === "function"
          ? currentUpdate.payload(state)
          : currentUpdate.payload;
      state = { ...state, ...newState };
      currentUpdate = currentUpdate.nextUpdate;
    }
    this.firstUpdate = this.lastUpdate = null;
    return state;
  }
}
