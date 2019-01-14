let { types: t } = require("@babel/core");
let isFunction = require("./is-function");
let { CTX } = require("../consts");

module.exports = function isDynamic(node) {
  return (
    isFunction(node) ||
    t.isIdentifier(node) ||
    t.isConditionalExpression(node) ||
    (t.isMemberExpression(node) && node.object.name !== CTX) ||
    (t.isBinaryExpression(node) &&
      (isDynamic(node.left) || isDynamic(node.right)))
  );
};
