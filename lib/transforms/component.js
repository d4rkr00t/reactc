let { types: t } = require("@babel/core");
let isCreateElementExpression = require("../checks/is-create-element");

/**
 * Takes:
 * function App() {
 *   return React.createElement("div", null,
 *      React.createElement("p", null, "First paragraph ",
 *        React.createElement("i", null, "!")
 *      ),
 *      React.createElement("p", null, "Second paragraph ",
 *        React.createElement("b", null, "!")
 *     )
 *   );
 * }
 *
 * Produces:
 * function App(props, __context) {
 *   let __el0 = createElement('div');
 *   let __el1 = createElement('p');
 *   let __el2 = createElement('i');
 *   let __el3 = createElement('p');
 *   let __el4 = createElement('b');
 *
 *   render(
 *     __context.__root,
 *     __el0,
 *     [
 *       [__el1, [
 *         "First paragraph ",
 *         [__el2, ["!"]]]
 *       ],
 *       [__el3, [
 *         "Second paragraph",
 *         [__el4, ["!"]]
 *       ]
 *     ]
 *   );
 * }
 */

let elemGlobalId = 0;
function createElement(type, props) {
  let id = "__el" + ++elemGlobalId;
  return [
    id,
    t.callExpression(
      t.identifier("createElement"),
      [
        t.stringLiteral(type),
        !t.isNullLiteral(props)
          ? {
              ...props,
              properties: props.properties.map(prop => {
                if (prop.key.name === "className") {
                  prop.key.name = "class";
                }
                return prop;
              })
            }
          : false
      ].filter(Boolean)
    )
  ];
}

function processCreateElementNode(
  node,
  root,
  defineElementStatements,
  renderTree
) {
  if (t.isStringLiteral(node)) {
    renderTree.push(node.value);
    return;
  }

  let [id, newNode] = createElement(node.arguments[0].value, node.arguments[1]);
  let children = node.arguments.slice(2);
  let childrenProp = [];

  defineElementStatements.push(
    t.variableDeclaration("let", [
      t.variableDeclarator(t.identifier(id), newNode)
    ])
  );

  renderTree.push([root, t.identifier(id), childrenProp]);

  children.forEach(child =>
    processCreateElementNode(
      child,
      t.identifier(id),
      defineElementStatements,
      childrenProp
    )
  );
}

function buildRenderArguments(renderTree) {
  return t.arrayExpression(
    renderTree.map(item =>
      typeof item === "string"
        ? t.stringLiteral(item)
        : t.arrayExpression([item[1], buildRenderArguments(item[2])])
    )
  );
}

module.exports = function transformComponent(path) {
  let { id, params, body } = path.node;
  let updatedParams = [
    params[0] || t.identifier("__props"),
    t.identifier("__context")
  ];

  let defineElementStatements = [];
  let renderTree = [];

  path.traverse({
    ReturnStatement(path) {
      if (!isCreateElementExpression(path.node.argument)) return;
      processCreateElementNode(
        path.node.argument,
        t.memberExpression(t.identifier("__context"), t.identifier("__root")),
        defineElementStatements,
        renderTree
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
      t.expressionStatement(
        t.callExpression(t.identifier("render"), [
          renderTree[0][0],
          renderTree[0][1],
          buildRenderArguments(renderTree[0][2])
        ])
      )
    ])
  );
};
