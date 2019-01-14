let { types: t } = require("@babel/core");

module.exports = function isCreateElementExpression(expression) {
  return (
    t.isCallExpression(expression) &&
    (expression.callee.object && expression.callee.object.name === "React") &&
    expression.callee.property.name === "createElement"
  );
};
