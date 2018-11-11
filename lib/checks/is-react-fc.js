let isCreateElementExpression = require("./is-create-element");

// TODO: Properly implement that
module.exports = function isReactFunctionComponent(path) {
  let isComponent = false;

  path.traverse({
    CallExpression(path) {
      isComponent = isCreateElementExpression(path.node);
    }
  });

  return isComponent;
};
