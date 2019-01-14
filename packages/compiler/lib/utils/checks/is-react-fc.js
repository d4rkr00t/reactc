let isCreateElementExpression = require("./is-create-element");

// TODO: Properly implement that
module.exports = function isReactFunctionComponent(path) {
  if (path.removed) return false;
  let isComponent = false;

  path.traverse({
    CallExpression(path) {
      if (!isComponent) {
        isComponent = isCreateElementExpression(path.node);
      }
    }
  });

  return isComponent;
};
