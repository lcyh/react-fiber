export function setProps(dom, oldProps, newProps) {
  for (let key in oldProps) {
    if (key !== "children") {
      if (!newProps.hasOwnProperty(key)) {
        //老的有，新的没有
        dom.removeAttribute(key);
      } else {
        // 新老都有
        setProp(dom, key, newProps[key]);
      }
    }
  }
  for (let key in newProps) {
    if (newProps.hasOwnProperty(key)) {
      if (key !== "children") {
        setProp(dom, key, newProps[key]);
      }
    }
  }
}
function setProp(dom, key, value) {
  if (/^on/.test(key)) {
    dom[key.toLowerCase()] = value;
  } else if (key === "style") {
    for (let styleName in value) {
      dom.style[styleName] = value[styleName];
    }
  } else {
    dom.setAttribute(key, value);
  }
}
