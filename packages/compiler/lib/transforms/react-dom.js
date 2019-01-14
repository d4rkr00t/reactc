let { types: t } = require("@babel/core");

/**
 * Takes:
 * ReactDOM.render(React.createElement(App, null), document.getElementById('app'));
 *
 * Produces:
 * mount(document.getElementById("app"), new Map(), App, null));
 */
module.exports = function transformReactDOMRender(path) {
  let [createElementNode, rootNode] = path.node.arguments;

  return t.callExpression(t.identifier("mount"), [
    rootNode,
    t.identifier("gCtx"),
    createElementNode.arguments[0],
    createElementNode.arguments[1]
  ]);
};
