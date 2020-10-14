import { ELEMENT_TEXT } from "./constants";
import { scheduleRoot, useState, useReducer } from "./schedule";
import { Update, UpdateQueue } from "./updateQueue";

function createElement(type, config, ...children) {
  delete config.__self;
  delete config.__source; //表示这个元素是在哪行哪列哪个文件生成的
  return {
    type,
    props: {
      ...config, //做了一个兼容处理，如果是React元素的话返回自己，如果是文本类型，如果是一个字符串的话，返回元素对象
      children: children.map((child) => {
        if (typeof child === "object") {
          return child;
        } else {
          return { type: ELEMENT_TEXT, props: { text: child, children: [] } };
        }
      }),
    },
  };
}
class Component {
  constructor(props) {
    this.props = props;
  }
  setState(payload) {
    // setState的参数 payload可能是对象或函数，payload被 new Update包装管理
    // enqueueUpdata收集 new Update实例，也就是收集 payload
    this.internalFiber.updateQueue.enqueueUpdate(new Update(payload));
    //调用setState,会重新从root fiber更新
    scheduleRoot();
  }
}
Component.prototype.isReactComponent = {};
const React = {
  createElement,
  Component,
  useState,
  useReducer,
};
export default React;
