let { types: t } = require("@babel/core");
let isFunction = require("./is-function");
let { CTX } = require("../consts");

function isDynamicTemplateLiteral(node) {
  return t.isTemplateLiteral(node) && node.expressions.length;
}

module.exports = function isDynamic(node) {
  return (
    isFunction(node) ||
    isDynamicTemplateLiteral(node) ||
    t.isObjectExpression(node) ||
    t.isCallExpression(node) ||
    t.isIdentifier(node) ||
    t.isConditionalExpression(node) ||
    (t.isMemberExpression(node) && node.object.name !== CTX) ||
    (t.isBinaryExpression(node) &&
      (isDynamic(node.left) || isDynamic(node.right)))
  );
};
