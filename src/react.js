import { ELEMENT_TEXT } from "./constants";

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
const React = {
  createElement,
};
export default React;
