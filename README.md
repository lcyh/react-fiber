### React16-fiber

```
  从根节点开始渲染和调度 两个阶段:

  1.diff阶段/render阶段
  1)对比新旧的虚拟DOM，进行增量 更新或创建;
  2)这个阶段可以比较花时间，可以我们对任务进行拆分，拆分的维度虚拟DOM。此阶段可以暂停;
  3)render阶段成果是effect list知道哪些节点更新哪些节点删除了，哪些节点增加了;
  4)render阶段有两个任务1.根据虚拟DOM生成fiber树 2.收集effect list;
  2.commit阶段，进行DOM更新创建阶段，此阶段不能暂停，要一气呵成;
```

#### 创建 fiber 树

**schedule/diff/render 阶段**

- beginWork
  - 从根 root fiber 开始创建真实 DOM
  - 从根 fiber 开始创建 fiber 子树，并且设置当前 DOM 的 props 属性
  - 创建的 fiber 子树里有， tag,type,props,child,sibling,alternate,return,statNode,effectTag,可以根据 child,sibling,return 这三个属性，找到对应的父子兄弟 fiber,解决 react15，深度递归比遍历不能随时中断(或者是说中断后只能重新开始遍历，找不到之前中断的节点位置，影响性能)；
- completeWork
  - 根据 child，sibling,return 生成对应的 effect list 副作用链表；
  - effect list 主要有三个指针，firstEffect,nextEffect,lastEffect 组成的单项链表；
  - effect list 的顺序是 fiber 创建完成的顺序；

**commit 阶段**

- 进行 DOM 更新创建阶段，此阶段不能暂停，要一气呵成;
- workInProgressRoot 会将渲染的 fiber 树一次插入到页面里；
- currentRoot = workInProgressRoot，保存当前最终渲染的后的 fiber 树，方便下次更新时拿到 oldFiber 和新的虚拟 DOM 的 type 做对比；

#### 更新 fiber 树

**schedule/diff/render 阶段**

- workInProgressRoot =workInProgressRoot(保存上次渲染的 fiber 树),rootFiber.alternate = currentRoot(当前 rootFiber 树的 alternate 属性指向上次渲染的 fiber 树);
- beginWork-创建 fier 树和更新 fiber 树都会调用
  - 深度优先，递归遍历比较 oldFiber 和 new 虚拟 DOM 的 type 属性，判断是否是相同类型的元素；
  - 创建 fiber 树后，从第一渲染开始，当前的 rootFiber 树，渲染得到的新 fiber 子树都会有 alternate 属性指向 oldFiber;
  - 渲染得到的 fiber 子树，类型相同时，effectTag=UPDATE;类型不相同时，effectTag=DELETION

### commit 阶段

- 根据 currentFiber.effectTag 进行 fiber 树的增加，删除，更新真实 DOM 操作；

### 类组件(Class 组件)

- setState(),批量更新
  - setState(payload),payload 是对象或者函数;
  - payload 会被 Update 包装管理，每个 payload 被一个 new Update(payload)包装管理；
  - 调用 setState(),内部会调用 enqueueUpdate()方法,生成一个 updateQueue 进行对 state 状态管理的单项链表；
  - state 状态管理的单项链表是 this.firstUpdate,this.nextUpdate,this.lastUpdate 三个指针形成，通过 while 循环将多个 payload 合并生成新的 state;
  - 调用 setState(),每部会调用 scheduleRoot(),从 root fiber 开始更新渲染整个 fiber 树,从而将新的 state 渲染到页面上；

### 函数式组件 hooks

- useReducer
  let [state,dispatch]=useReducer(reducer,initialState);
  - state 是 initialState 的值
  - dispatch(action):1.内部调用 reducer()函数，let newState=reducer(action,initialState),返回新的 state;2.调用 forceUpdate(),新的 state 替换旧的 state,state=newState;

* useState 是 useReducer 的语法糖
  - return useReducer(null,initialState);
