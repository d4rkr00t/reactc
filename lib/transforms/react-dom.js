let { types: t } = require("@babel/core");

/**
 * Takes:
 * ReactDOM.render(React.createElement(App, null), document.getElementById('app'));
 *
 * Produces:
 * renderChildren(document.getElementById("app"), App(null));
 */
module.exports = function transformReactDOMRender(path) {
  let [createElementNode, rootNode] = path.node.arguments;

  return t.callExpression(t.identifier("renderChildren"), [
    rootNode,
    t.arrayExpression([
      t.callExpression(createElementNode.arguments[0], [
        createElementNode.arguments[1]
      ])
    ])
  ]);
};
