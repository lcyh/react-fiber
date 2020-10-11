import { setProps } from "./utils";
import {
  ELEMENT_TEXT,
  TAG_ROOT,
  TAG_HOST,
  TAG_TEXT,
  PLACEMENT,
} from "./constants";

let workInProgressRoot = null; //正在渲染中的根Fiber
let nextUnitOfWork = null; //下一个工作单元

export function scheduleRoot(rootFiber) {
  //把当前fiber树设置为nextUnitOfWork开始进行调度
  workInProgressRoot = rootFiber;
  nextUnitOfWork = workInProgressRoot;
}
// 开始执行下一个工作单元
export function performUnitOfWork(currentFiber) {
  // 根据虚拟DOM开始创建fiber树,有 type,props,tag,child,sibling,return，effectTag,nextEffect属性
  beginWork(currentFiber);
  //如果有子节点就返回第一个子节点
  if (currentFiber.child) {
    return currentFiber.child;
  }
  while (currentFiber) {
    //如果没有child属性，说明创建完成了此fiber树，可以结束此fiber的渲染了
    completeUnitOfWork(currentFiber);
    if (currentFiber.sibling) {
      return currentFiber.sibling;
    }
    currentFiber = currentFiber.return;
  }
}
// 生成effect list链表  firstEffect nextEffect lastEffect
function completeUnitOfWork(currentFiber) {
  let returnFiber = currentFiber.return;
  if (returnFiber) {
    // 1.将自己fiber的子fiber先挂到父fiber上
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect;
    }
    if (currentFiber.lastEffect) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
      }
      returnFiber.lastEffect = currentFiber.lastEffect;
    }
    // 2.将自己fiber挂在父fiber上
    const effectTag = currentFiber.effectTag;
    if (effectTag) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber;
      } else {
        returnFiber.firstEffect = currentFiber;
      }
      returnFiber.lastEffect = currentFiber;
    }
  }
}
export function beginWork(currentFiber) {
  // 根root fiber节点
  if (currentFiber.tag === TAG_ROOT) {
    updateHostRoot(currentFiber);
    // 原生文本节点
  } else if (currentFiber.tag === TAG_TEXT) {
    updateHostText(currentFiber);
    //如果是原生DOM节点
  } else if (currentFiber.tag === TAG_HOST) {
    updateHost(currentFiber);
  }
}
export function updateHostText(currentFiber) {
  if (!currentFiber.statNode) {
    currentFiber.statNode = createDOM(currentFiber); //先创建真实的DOM节点
  }
}
function updateHost(currentFiber) {
  if (!currentFiber.statNode) {
    currentFiber.statNode = createDOM(currentFiber); //先创建真实的DOM节点
  }
  const newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}
function createDOM(currentFiber) {
  if (currentFiber.type === ELEMENT_TEXT) {
    return document.createTextNode(currentFiber.props.text);
  }
  // 根据虚拟DOM接待创建 真实DOM元素
  const statNode = document.createElement(currentFiber.type);
  // 给当前真实DOM添加props属性
  updateDOM(statNode, {}, currentFiber.props);
  return statNode;
}
function updateDOM(statNode, oldProps, newProps) {
  setProps(statNode, oldProps, newProps);
}
export function updateHostRoot(currentFiber) {
  const newChildren = currentFiber.props.children;
  // 渲染root fiber的子虚拟DOM节点为 子fiber
  reconcileChildren(currentFiber, newChildren);
}
export function reconcileChildren(currentFiber, newChildren) {
  let newChildIndex = 0;
  let prevSibling = null;
  while (newChildIndex < newChildren.length) {
    const newChild = newChildren[newChildIndex];
    let tag;
    if (newChild && newChild.type === ELEMENT_TEXT) {
      tag = TAG_TEXT; //文本
    } else if (newChild && typeof newChild.type === "string") {
      tag = TAG_HOST; //原生DOM组件
    }
    let newFiber = {
      tag, //原生DOM组件
      type: newChild.type, //具体的元素类型
      props: newChild.props, //新的属性对象
      statNode: null, //第一次创建 statNode肯定是空的
      return: currentFiber, //父Fiber
      effectTag: PLACEMENT, //副作用标识
      nextEffect: null,
    };
    // A1元素子节点  //<div id="A1" style={style}>
    if (newFiber) {
      if (newChildIndex === 0) {
        // 第一个儿子对应child属性
        currentFiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }
    }
    prevSibling = newFiber;
    newChildIndex++;
  }
}
function commitRoot() {
  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }
  workInProgressRoot = null;
}
function commitWork(currentFiber) {
  if (!currentFiber) return;
  let returnFiber = currentFiber.return;
  let domReturn = returnFiber.statNode;
  if (currentFiber.effectTag === PLACEMENT && currentFiber.statNode != null) {
    //新增加节点
    let nextFiber = currentFiber;
    domReturn.appendChild(nextFiber.statNode);
  }
  currentFiber.effectTag = null;
}
function workLoop(deadline) {
  let shouldYeild = false;
  while (nextUnitOfWork && !shouldYeild) {
    // 执行当前工作单元并返回下一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    console.log("返回值-workInProgressRoot", workInProgressRoot);
    // 交出浏览器控制权
    shouldYeild = deadline.timeRemaining() < 1;
  }
  //不管有没有任务，都请求再次调度 每一帧都要执行一次workLoop
  // 如果没有下一个工作单元，并且当前渲染树存在，则进行提交effect-list
  if (!nextUnitOfWork && workInProgressRoot) {
    //如果时间片到期后还有任务没有完成，就需要请求浏览器再次调度
    console.log("render阶段结束");
    commitRoot();
  }
  // 如果有下一个工作单元，但是当前帧没有时间了，重新向浏览器发起请求
  requestIdleCallback(workLoop);
}
//ReactDOM.render() 开始执行requestIdleCallback
//开始在空闲时间执行workLoop
requestIdleCallback(workLoop);
