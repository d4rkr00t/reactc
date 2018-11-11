let { types: t } = require("@babel/core");

/**
 * Takes:
 * ReactDOM.render(React.createElement(App, null), document.getElementById('app'));
 *
 * Produces:
 * App(null, { __root: document.getElementById("app") });
 */
module.exports = function transformReactDOMRender(path) {
  let [createElementNode, rootNode] = path.node.arguments;

  return t.callExpression(createElementNode.arguments[0], [
    createElementNode.arguments[1],
    t.objectExpression([t.objectProperty(t.identifier("__root"), rootNode)])
  ]);
};
