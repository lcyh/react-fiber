import { setProps } from "./utils";
import {
  ELEMENT_TEXT,
  TAG_ROOT,
  TAG_HOST,
  TAG_TEXT,
  PLACEMENT,
  UPDATE,
  DELETION,
} from "./constants";

let workInProgressRoot = null; //正在渲染中的根Fiber
let nextUnitOfWork = null; //下一个工作单元
let currentRoot = null; //当前的根Fiber
let deletions = []; //要删除的fiber节点

export function scheduleRoot(rootFiber) {
  if (currentRoot && currentRoot.alternate) {
    //偶数次更新
    workInProgressRoot = currentRoot.alternate;
    workInProgressRoot.firstEffect = workInProgressRoot.lastEffect = workInProgressRoot.nextEffect = null;
    workInProgressRoot.props = rootFiber.props;
    workInProgressRoot.alternate = currentRoot;
  } else if (currentRoot) {
    rootFiber.alternate = currentRoot;
    workInProgressRoot = rootFiber;
  } else {
    // 第一次渲染(第一次创建)
    workInProgressRoot = rootFiber;
  }
  //把当前fiber树设置为nextUnitOfWork开始进行调度
  nextUnitOfWork = workInProgressRoot;
}
// 开始执行下一个工作单元
function performUnitOfWork(currentFiber) {
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
function beginWork(currentFiber) {
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
function updateHostText(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber); //先创建真实的DOM节点
  }
}
function updateHost(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber); //先创建真实的DOM节点
  }
  const newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}
function createDOM(currentFiber) {
  if (currentFiber.tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.props.text);
  } else if (currentFiber.tag === TAG_HOST) {
    // span div
    // 根据虚拟DOM接待创建 真实DOM元素
    const stateNode = document.createElement(currentFiber.type);
    // 给当前真实DOM添加props属性
    updateDOM(stateNode, {}, currentFiber.props);
    return stateNode;
  }
}
function updateDOM(stateNode, oldProps, newProps) {
  setProps(stateNode, oldProps, newProps);
}
function updateHostRoot(currentFiber) {
  const newChildren = currentFiber.props.children;
  // 渲染root fiber的子虚拟DOM节点为 子fiber
  reconcileChildren(currentFiber, newChildren);
}
//newChildren是一个虚拟DOM的数组 把虚拟DOM转成Fiber节点
function reconcileChildren(currentFiber, newChildren) {
  //[A1]
  let newChildIndex = 0; //新子节点的索引
  //如果说currentFiber有alternate并且alternate有child属性
  let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
  if (oldFiber)
    oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null;
  let prevSibling; //上一个新的子fiber
  //遍历我们的子虚拟DOM元素数组，为每个虚拟DOM元素创建子Fiber
  while (newChildIndex < newChildren.length || oldFiber) {
    let newChild = newChildren[newChildIndex]; //取出虚拟DOM节点[A1]{type:'A1'}
    let newFiber; //新的Fiber
    const sameType = oldFiber && newChild && oldFiber.type === newChild.type;
    let tag;
    if (newChild && newChild.type == ELEMENT_TEXT) {
      tag = TAG_TEXT; //这是一个文本节点
    } else if (newChild && typeof newChild.type === "string") {
      tag = TAG_HOST; //如果是type是字符串，那么这是一个原生DOM节点 "A1" div
    } //beginWork创建fiber 在completeUnitOfWork的时候收集effect
    if (sameType) {
      //说明老fiber和新虚拟DOM类型一样，可以复用老的DOM节点，更新即可
      if (oldFiber.alternate) {
        //说明至少已经更新一次了
        newFiber = oldFiber.alternate; //如果有上上次的fiber,就拿 过来作为这一次的fiber
        newFiber.props = newChild.props;
        newFiber.alternate = oldFiber;
        newFiber.effectTag = UPDATE;
        newFiber.nextEffect = null;
      } else {
        newFiber = {
          tag: oldFiber.tag, //TAG_HOST
          type: oldFiber.type, //div
          props: newChild.props, //{id="A1" style={style}} 一定要用新的元素的props
          stateNode: oldFiber.stateNode, //div还没有创建DOM元素
          return: currentFiber, //父Fiber returnFiber
          alternate: oldFiber, //让新的fiber的alternate指向老的fiber节点
          effectTag: UPDATE, //副作用标识 render我们要会收集副作用 增加 删除 更新
          nextEffect: null, //effect list 也是一个单链表
        };
      }
    } else {
      if (newChild) {
        //看看新的虚拟DOM是不是为null
        newFiber = {
          tag, //TAG_HOST
          type: newChild.type, //div
          props: newChild.props, //{id="A1" style={style}}
          stateNode: null, //div还没有创建DOM元素
          return: currentFiber, //父Fiber returnFiber
          effectTag: PLACEMENT, //副作用标识 render我们要会收集副作用 增加 删除 更新
          nextEffect: null, //effect list 也是一个单链表
          //effect list顺序和 完成顺序是一样的，但是节点只放那些出钱的人的fiber节点，不出钱绕过去
        };
      }
      if (oldFiber) {
        oldFiber.effectTag = DELETION;
        deletions.push(oldFiber);
      }
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling; //oldFiber指针往后移动一次
    }
    //最小的儿子是没有弟弟的
    if (newFiber) {
      if (newChildIndex == 0) {
        //如果当前索引为0，说明这是太子
        currentFiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber; //让太子的sibling弟弟指向二皇子
      }
      prevSibling = newFiber;
    }
    newChildIndex++;
  }
}

function commitRoot() {
  // 先删除 effectTag===DELETION的元素
  deletions.forEach(commitWork);
  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }
  deletions.length = 0; //先把要删除的节点清空掉
  //保存当前最终渲染的后的fiber树
  currentRoot = workInProgressRoot;
  //将完整的fiber树渲染到页面后，清除fiber树
  workInProgressRoot = null;
}
function commitWork(currentFiber) {
  if (!currentFiber) return;
  let returnFiber = currentFiber.return;
  let domReturn = returnFiber.stateNode;
  if (currentFiber.effectTag === PLACEMENT && currentFiber.stateNode != null) {
    //新增加节点
    let nextFiber = currentFiber;
    domReturn.appendChild(nextFiber.stateNode);
  } else if (currentFiber.effectTag === DELETION) {
    //如果是删除则删除并返回
    return commitDeletion(currentFiber, domReturn);
  } else if (currentFiber.effectTag === UPDATE) {
    //如果是更新
    if (currentFiber.type === ELEMENT_TEXT) {
      if (currentFiber.alternate.props.text != currentFiber.props.text) {
        currentFiber.stateNode.textContent = currentFiber.props.text;
      }
    } else {
      updateDOM(
        currentFiber.stateNode,
        currentFiber.alternate.props,
        currentFiber.props
      );
    }
  }
  currentFiber.effectTag = null;
}
function commitDeletion(currentFiber, domReturn) {
  if (currentFiber.tag == TAG_HOST || currentFiber.tag == TAG_TEXT) {
    domReturn.removeChild(currentFiber.stateNode);
  } else {
    commitDeletion(currentFiber.child, domReturn);
  }
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
