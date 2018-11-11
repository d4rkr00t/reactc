let { types: t } = require("@babel/core");
let isCreateElementExpression = require("../checks/is-create-element");

/**
 * Takes:
 * function App() {
 *   return React.createElement("div", null, "Hello ReactC");
 * }
 *
 * Produces:
 * function App(props, __context) {
 *   var _el = document.createElement('div');
 *   var _el_child = document.createTextNode('Hello ReactC');
 *   _el.appendChild(_el_child);
 *   __context.appendChild(_el);
 * }
 */

let elemGlobalId = 0;
function createElement(type) {
  let id = "__el" + ++elemGlobalId;
  return [
    id,
    t.callExpression(
      t.memberExpression(
        t.identifier("document"),
        t.identifier("createElement")
      ),
      [t.stringLiteral(type)]
    )
  ];
}

function createTextNode(text) {
  let id = "__el" + ++elemGlobalId;
  return [
    id,
    t.callExpression(
      t.memberExpression(
        t.identifier("document"),
        t.identifier("createTextNode")
      ),
      [t.stringLiteral(text)]
    )
  ];
}

module.exports = function transformComponent(path) {
  let { id, params, body } = path.node;
  let updatedParams = [
    params[0] || t.identifier("__props"),
    t.identifier("__context")
  ];

  let defineElementStatements = [];
  let renderElementsStatements = [];

  path.traverse({
    ReturnStatement(path) {
      if (!isCreateElementExpression(path.node.argument)) return;
      let [id, node] = createElement(path.node.argument.arguments[0].value);
      defineElementStatements.push(
        t.variableDeclaration("var", [
          t.variableDeclarator(t.identifier(id), node)
        ])
      );

      renderElementsStatements.push(
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              t.memberExpression(
                t.identifier("__context"),
                t.identifier("__root")
              ),
              t.identifier("appendChild")
            ),
            [t.identifier(id)]
          )
        )
      );

      let [childId, childNode] = createTextNode(
        path.node.argument.arguments[2].value
      );
      defineElementStatements.push(
        t.variableDeclaration("var", [
          t.variableDeclarator(t.identifier(childId), childNode)
        ])
      );
      renderElementsStatements.push(
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(t.identifier(id), t.identifier("appendChild")),
            [t.identifier(childId)]
          )
        )
      );

      path.remove();
    }
  });

  return t.functionDeclaration(
    id,
    updatedParams,
    t.blockStatement([
      ...path.node.body.body,
      ...defineElementStatements,
      ...renderElementsStatements
    ])
  );
};
