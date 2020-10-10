### React16-fiber

- beginWork
  - 从根 root fiber 开始创建真实 DOM
  - 从根 fiber 开始创建 fiber 子树，并且设置当前 DOM 的 props 属性
  - 创建的 fiber 子树里有， tag,type,props,child,sibling,return,statNode,effectTag,可以根据 child,sibling,return 这三个属性，找到对应的父子兄弟 fiber,解决 react15，深度递归比遍历不能随时中断(或者是说中断后只能重新开始遍历，找不到之前中断的节点位置，影响性能)；
- ## completeWork
  - 根据吃了点，sibling,return 生成对应的 effect list 副作用链表；
  - effect list 主要有三个指针，firstEffect,nextEffect,lastEffect 组成的单项链表；
  - effect list 的顺序是 fiber 创建完成的顺序；
