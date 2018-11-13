let { types: t } = require("@babel/core");
let isCreateElementExpression = require("../checks/is-create-element");
let util = require("util");

/**
 * Takes:
 * function App(__props, __context) {
 *  return React.createElement("div", {
 *    className: "barchart"
 *  }, colors.map(function (color) {
 *    var height = Math.floor(Math.random() * (140 - 80 + 1)) + 60;
 *    return React.createElement("div", {
 *      className: "barchart__bar-wrapper"
 *    }, React.createElement("div", {
 *      className: "barchart__bar-title",
 *      style: {
 *        color
 *      }
 *    }, height), React.createElement("div", {
 *      className: "barchart__bar",
 *      style: {
 *        backgroundColor: color,
 *        height
 *      }
 *    }));
 *  }));
 *}
 *
 * Produces:
 * function App(__props, __context) {
 *   let __el_0 = createElement('div', { class: "barchart" });
 *   renderChildren(__el_0, [colors.map(function (color, __props, __context) { // TODO: Fix signature later
 *     let height = Math.floor(Math.random() * (140 - 80 + 1)) + 60;
 *     let __el_1 = createElement('div', { class: "barchart__bar-wrapper" });
 *     let __el_2 = createElement('div', { class: "barchart__bar-title", style: { color } });
 *     let __el_3 = createElement('div', { class: "barchart__bar", style: { height, backgroundColor: color } });
 *
 *     renderChildren(__el_2, [height]);
 *     renderChildren(__el_1, [__el_2, __el_3]);
 *
 *     return __el_1;
 *   })]);
 *
 *   return __el_0;
 * }
 */

let elemGlobalId = 0;
function createElement(type, props) {
  let id = "__el_" + ++elemGlobalId;
  return [
    t.identifier(id),
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

function createDefineElementStatement(id, node) {
  return t.variableDeclaration("let", [t.variableDeclarator(id, node)]);
}

/**
 * Takes: Array<children>
 * Returns:
 * [
 *   Array<[id, node]> – define element statements
 *   Array<[[id1, id2, ...], [id3, id4, ...]]>
 * ]
 */
function processChildren(parentId, children) {
  if (!children.length) return [];

  let defineStatements = [];
  let directChildren = [parentId];
  let renderTree = [directChildren];

  children.forEach(child => {
    if (
      t.isStringLiteral(child) ||
      t.isNumericLiteral(child) ||
      t.isIdentifier(child) ||
      (t.isCallExpression(child) && !isCreateElementExpression(child))
    ) {
      directChildren.push(child);
    }

    if (!isCreateElementExpression(child)) return;

    let [id, newNode] = createElement(
      child.arguments[0].value,
      child.arguments[1]
    );
    let [ds, rt] = processChildren(id, child.arguments.slice(2));

    directChildren.push(id);
    defineStatements.push(createDefineElementStatement(id, newNode));

    if (ds && ds.length) {
      defineStatements.push(...ds);
    }

    if (rt && rt.length) {
      renderTree.push(...rt);
    }
  });

  return [defineStatements, renderTree];
}

function processRenderTree(renderTree) {
  return (renderTree || []).map(render =>
    t.callExpression(t.identifier("renderChildren"), [
      render[0],
      t.arrayExpression(render.slice(1))
    ])
  );
}

module.exports = function transformComponent(path) {
  path.traverse({
    ReturnStatement(path) {
      if (!isCreateElementExpression(path.node.argument)) return;
      let node = path.node.argument;
      let [id, newNode] = createElement(
        node.arguments[0].value,
        node.arguments[1]
      );

      const [defineStatements, renderTree] = processChildren(
        id,
        node.arguments.slice(2)
      );

      // console.log(util.inspect(renderTree, { depth: 2 }));

      path.replaceWithMultiple([
        createDefineElementStatement(id, newNode),
        ...defineStatements,
        ...processRenderTree(renderTree),
        t.returnStatement(id)
      ]);
    }
  });
};
