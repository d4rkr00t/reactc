let isCreateElementExpression = require("./is-create-element");

// TODO: Properly implement that
module.exports = function isReactFunctionComponent(path) {
  if (path.removed) return false;
  let isComponent = false;
  let node = path.node;

  path.traverse({
    CallExpression(path) {
      if (!isComponent) {
        isComponent =
          isCreateElementExpression(path.node) &&
          path.getFunctionParent().node === node;
      }
    }
  });

  return isComponent;
};
