let { types: t } = require("@babel/core");
let isCreateElementExpression = require("../checks/is-create-element");
let util = require("util");

/**
 * function Countdown(props, ctx) {
 *  if (ctx._) {
 *    // Re-render
 *    if (ctx.props.children !== props.children) {
 *      renderChildren(ctx.a, props.children);
 *    }
 *  } else {
 *    // Initial render
 *    createElement(ctx, "a", "div");
 *    renderChildren(ctx.a, props.children);
 *  }
 *
 *  return ctx.a._;
 *}
 *
 *function App(_props, ctx) {
 *  let [count, setCount] = useState(ctx, App, Math.random());
 *  useEffect(ctx, () => {
 *    let timeout = setTimeout(() => {
 *      setCount(count + 1);
 *    }, 1000);
 *    return () => clearTimeout(timeout);
 *  });
 *  if (ctx._) {
 *    // Re-render
 *    createComponent(ctx, "b", Countdown, { children: count });
 *    createElement(ctx, "c", "button", { onClick: () => setCount(count + 1) });
 *  } else {
 *    // Initial render
 *    createElement(ctx, "a", "div");
 *    createElement(ctx, "c", "button", { onClick: () => setCount(count + 1) });
 *    renderChildren(ctx.c, ["Update counter"]);
 *    createComponent(ctx, "b", Countdown, { children: count });
 *    renderChildren(ctx.a, [ctx.b, ctx.c]);
 *  }
 *  return ctx.a._;
 *}
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
  return t.identifier("e" + ++elemGlobalId);
}

function createElement(id, type, props) {
  return t.callExpression(
    t.identifier("createElement"),
    [
      t.identifier("__context"),
      t.stringLiteral(id.name),
      t.stringLiteral(type.value),
      processProps(props)
    ].filter(Boolean)
  );
}

let componentGlobalId = 0;
function createComponentId() {
  return t.identifier("c" + ++componentGlobalId);
}

/**
 * createComponent(ctx, "b", Countdown, { children: count });
 */
function createComponent(id, type, props, children) {
  return t.callExpression(
    t.identifier("createComponent"),
    [
      t.identifier("__context"),
      t.stringLiteral(id.name),
      type,
      processProps(props, children)
    ].filter(Boolean)
  );
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
  let directChildren = skipParentId ? [] : [contextProperty(parentId)];
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

    directChildren.push(contextProperty(id));
    defineStatements.push(newNode);
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

function contextElementProperty(id) {
  return t.memberExpression(contextProperty(id), t.identifier("_"));
}

function contextProperty(id) {
  return t.memberExpression(t.identifier("__context"), id);
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
        newNode,
        ...defineStatements,
        ...processRenderTree(renderTree),
        t.returnStatement(contextElementProperty(id))
      ]);
    }
  });
};
