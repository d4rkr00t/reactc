let { types: t } = require("@babel/core");

// TODO: Properly implement that
module.exports = function isReactDOMRenderCallExpression(node) {
  return (
    t.isMemberExpression(node.callee) &&
    node.callee.object.name === "ReactDOM" &&
    node.callee.property.name === "render"
  );
};
