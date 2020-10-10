import { TAG_ROOT } from "./constants";
import { scheduleRoot } from "./schedule";
function render(element, container) {
  let rootFiber = {
    tag: TAG_ROOT,
    statNode: container,
    props: {
      children: [element],
    },
  };
  scheduleRoot(rootFiber);
}
const ReactDOM = {
  render,
};
export default ReactDOM;
