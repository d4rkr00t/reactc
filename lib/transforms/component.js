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

function processProps(props, children) {
  let newProps = [];
  if (!t.isNullLiteral(props)) {
    newProps = newProps.concat(
      props.properties.map(prop => {
        if (prop.key.name === "className") {
          prop.key.name = "class";
        }
        return prop;
      })
    );
  }

  if (children) {
    newProps.push(t.objectProperty(t.identifier("children"), children));
  }

  if (newProps.length) {
    return t.objectExpression(newProps);
  }

  return false;
}

let elemGlobalId = 0;
function createElementId() {
  return t.identifier("__el_" + ++elemGlobalId);
}

function createElement(id, type, props) {
  return t.callExpression(
    t.identifier("createElement"),
    [t.stringLiteral(type.value), processProps(props)].filter(Boolean)
  );
}

let componentGlobalId = 0;
function createComponentId() {
  return t.identifier("__cmp_" + ++componentGlobalId);
}

function createComponent(id, type, props, children) {
  return t.callExpression(
    type,
    [processProps(props, children)].filter(Boolean)
  );
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
function processChildren(parentId, children, skipParentId = false) {
  if (!children.length) return [];

  let defineStatements = [];
  let directChildren = skipParentId ? [] : [parentId];
  let renderTree = [directChildren];

  children.forEach(child => {
    if (
      t.isStringLiteral(child) ||
      t.isNumericLiteral(child) ||
      t.isIdentifier(child) ||
      t.isMemberExpression(child) ||
      (t.isCallExpression(child) && !isCreateElementExpression(child))
    ) {
      directChildren.push(child);
    }

    if (!isCreateElementExpression(child)) return;

    // If child is a variable
    let id;
    let newNode;
    if (t.isIdentifier(child.arguments[0])) {
      id = createComponentId();
      let [ds, rt] = processChildren(id, child.arguments.slice(2), true);
      newNode = createComponent(
        id,
        child.arguments[0],
        child.arguments[1],
        rt && rt.length
          ? t.arrayExpression(rt.reduce((acc, item) => acc.concat(item), []))
          : null
      );

      if (ds && ds.length) {
        defineStatements.push(...ds);
      }
    } else {
      id = createElementId();
      newNode = createElement(id, child.arguments[0], child.arguments[1]);
      let [ds, rt] = processChildren(id, child.arguments.slice(2));

      if (ds && ds.length) {
        defineStatements.push(...ds);
      }

      if (rt && rt.length) {
        renderTree.push(...rt);
      }
    }

    directChildren.push(id);
    defineStatements.push(createDefineElementStatement(id, newNode));
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

      // If child is a variable
      let id;
      let newNode;
      let defineStatements = [];
      let renderTree = [];

      if (t.isIdentifier(node.arguments[0])) {
        id = createComponentId();
        let [ds, rt] = processChildren(id, node.arguments.slice(2), true);
        newNode = createComponent(
          id,
          node.arguments[0],
          node.arguments[1],
          rt && rt.length
            ? t.arrayExpression(rt.reduce((acc, item) => acc.concat(item), []))
            : null
        );
        defineStatements.push(...(ds || []));
      } else {
        id = createElementId();
        newNode = createElement(id, node.arguments[0], node.arguments[1]);
        [defineStatements, renderTree] = processChildren(
          id,
          node.arguments.slice(2)
        );
      }

      path.replaceWithMultiple([
        createDefineElementStatement(id, newNode),
        ...defineStatements,
        ...processRenderTree(renderTree),
        t.returnStatement(id)
      ]);
    }
  });
};
