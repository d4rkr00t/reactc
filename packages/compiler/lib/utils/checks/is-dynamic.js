let { types: t } = require("@babel/core");
let { CTX } = require("../consts");

module.exports = function isDynamic(node) {
  return (
    t.isFunctionExpression(node) ||
    t.isIdentifier(node) ||
    t.isArrowFunctionExpression(node) ||
    t.isConditionalExpression(node) ||
    (t.isMemberExpression(node) && node.object.name !== CTX) ||
    (t.isBinaryExpression(node) &&
      (isDynamic(node.left) || isDynamic(node.right)))
  );
};
