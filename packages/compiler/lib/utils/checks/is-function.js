let { types: t } = require("@babel/core");

module.exports = function isFunction(node) {
  return t.isFunctionExpression(node) || t.isArrowFunctionExpression(node);
};
