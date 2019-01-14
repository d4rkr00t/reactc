let { types: t } = require("@babel/core");
let ch = require("../utils/create-helpers");
let { CTX } = require("../utils/consts");
let isCreateElementExpression = require("../utils/checks/is-create-element");
let isReactFunctionComponent = require("../utils/checks/is-react-fc");

let componentGlobalId = 0;
function createComponentId() {
  return "c" + ++componentGlobalId;
}

let elemGlobalId = 0;
function createElementId() {
  return "e" + ++elemGlobalId;
}

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

  if (children && children.length) {
    newProps.push(
      t.objectProperty(
        t.identifier("children"),
        children.length === 1 ? children[0] : t.arrayExpression(children)
      )
    );
  }

  if (newProps.length) {
    return t.objectExpression(newProps);
  }

  return false;
}

/**
 * React.createElement("div", null, props.children);
 *                    ["div", null, props.children];
 *                      0     1     2+
 */
function processReactCreateElement(node) {
  return [node.arguments[0], node.arguments[1], node.arguments.slice(2)];
}

function isDynamic(node) {
  return (
    t.isFunctionExpression(node) ||
    t.isIdentifier(node) ||
    t.isArrowFunctionExpression(node) ||
    t.isConditionalExpression(node) ||
    (t.isMemberExpression(node) && node.object.name !== CTX) ||
    (t.isBinaryExpression(node) &&
      (isDynamic(node.left) || isDynamic(node.right)))
  );
}

function getDynamicProps(props) {
  return (props || []).filter(prop => isDynamic(prop.value));
}

function isDynamicProps(props) {
  if (!t.isObjectExpression(props)) {
    return false;
  }

  return props.properties.some(prop => {
    if (isDynamic(prop.value)) {
      return true;
    }
    return false;
  });
}

function isDynamicChildren(children) {
  return children.some(child => {
    if (isDynamic(child)) {
      return true;
    }
    return false;
  });
}

function procsessChildren(children, initialRenderPath, reRenderPath) {
  return children.map(child => {
    if (
      t.isStringLiteral(child) ||
      t.isNumericLiteral(child) ||
      t.isIdentifier(child) ||
      t.isMemberExpression(child) ||
      (t.isCallExpression(child) && !isCreateElementExpression(child))
    ) {
      return child;
    }

    let [type, props, children] = processReactCreateElement(child);

    if (t.isStringLiteral(type)) {
      return ch.contextProperty(
        transformElement(
          type.value,
          props,
          children,
          initialRenderPath,
          reRenderPath
        )
      );
    } else {
      return ch.contextProperty(
        transformComponent(
          type.name,
          props,
          children,
          initialRenderPath,
          reRenderPath
        )
      );
    }
  });
}

/**
 * ->
 *  React.createElement(
 *    "div",
 *    { className: "counter" },
 *    props.children,
 *    "second child",
 *    React.createElement(Child, { prop: 1 }, "Text"));
 *
 * <- initial render:
 *  createElement(__ctx, "e1", "div", { className: "counter" });
 *  createComponent(__ctx, "c1", Child, { prop: "1", children: "Text" });
 *  renderChildren(__ctx, "e1", [props.children, "second child", __ctx.c1]);
 *
 * <- re-render:
 *  if (props.children !== __ctx.props.children) {
 *    renderChildren(__ctx, "e1", [props.children, "second child", __ctx.c1]);
 *  }
 */
function transformElement(
  type,
  props,
  children,
  initialRenderPath,
  reRenderPath,
  isRoot
) {
  let id = isRoot ? "$r" : createElementId();
  initialRenderPath.push(ch.createElement(id, type, processProps(props)));
  let directChildren = procsessChildren(
    children,
    initialRenderPath,
    reRenderPath
  );
  initialRenderPath.push(ch.renderChildren(id, directChildren));
  if (isDynamicProps(props)) {
    let dynamicProps = getDynamicProps(props.properties);
    reRenderPath.push(
      ...dynamicProps.reduce(
        (acc, prop) => acc.concat(ch.setAttr(id, prop.key, prop.value)),
        []
      )
    );
  }
  if (isDynamicChildren(directChildren)) {
    reRenderPath.push(ch.renderChildren(id, directChildren));
  }
  return id;
}

function transformComponent(
  type,
  props,
  children,
  initialRenderPath,
  reRenderPath
) {
  let id = createComponentId();
  let directChildren = procsessChildren(
    children,
    initialRenderPath,
    reRenderPath
  );
  initialRenderPath.push(
    ch.createComponent(id, type, processProps(props, directChildren))
  );
  if (isDynamicProps(props) || isDynamicChildren(children)) {
    reRenderPath.push(
      t.expressionStatement(
        t.callExpression(ch.memberExpression(CTX, id, "$"), [
          processProps(props, directChildren)
        ])
      )
    );
  }
  return id;
}

function transform(node) {
  let initialRenderPath = [];
  let reRenderPath = [];
  let [type, props, children] = processReactCreateElement(node);
  let id;

  if (t.isStringLiteral(type)) {
    id = transformElement(
      type.value,
      props,
      children,
      initialRenderPath,
      reRenderPath
    );
  } else {
    id = transformComponent(
      type.name,
      props,
      children,
      initialRenderPath,
      reRenderPath
    );
  }

  return [id, initialRenderPath, reRenderPath];
}

function findParentPath(path) {
  let funcParent = path.getFunctionParent();
  let parentPath = path;
  while (parentPath && funcParent.node.body !== parentPath.parentPath.node) {
    parentPath = parentPath.parentPath;
  }
  return parentPath;
}

function transformComponentInternals(path) {
  let renderPath = [];
  let updatePath = [];

  path.traverse({
    CallExpression(path) {
      if (path.removed) return;
      if (!isCreateElementExpression(path.node)) return;
      let [id, nodes, updateInstructions] = transform(path.node);
      let parentPath = findParentPath(path);

      renderPath.push(...nodes);
      updatePath.push(...updateInstructions);

      // ->
      //   return <bla/>;
      // <-
      //   __ctx.$r = __ctx.e1;
      //   __gctx.popHooksContext()
      //   return __ctx;
      if (t.isReturnStatement(parentPath.node)) {
        renderPath.push(
          ...[
            t.expressionStatement(
              t.assignmentExpression(
                "=",
                ch.contextProperty("$r"),
                ch.contextProperty(id)
              )
            ),
            ch.popHooksContext()
          ]
        );
        path.replaceWith(ch.ctxId);
      } else {
        path.replaceWith(ch.contextProperty(id));
      }

      if (t.isIfStatement(parentPath.node)) {
        updatePath.push(t.cloneNode(parentPath.node));
      }

      renderPath.push(t.cloneNode(parentPath.node));
      if (!parentPath.removed) parentPath.remove();
    }
  });

  renderPath = renderPath.filter(Boolean);
  updatePath = updatePath.filter(Boolean);
  path
    .get("body")
    .pushContainer("body", [
      t.ifStatement(
        t.binaryExpression("!==", ch.ctxId, ch.pCtxId),
        t.blockStatement(renderPath),
        t.blockStatement([...updatePath, ch.popHooksContext()])
      )
    ]);
}

function transfromNestedFunctions(path) {
  if (!isReactFunctionComponent(path)) return;
  path
    .get("body")
    .unshiftContainer("body", [
      ch.initComponentContext(),
      ch.setHooksContext()
    ]);
  transformComponentInternals(path);
}

module.exports = function transformComponent(path) {
  let { id, params } = path.node;
  let updatedParams = [
    ...(params.length ? params : [t.identifier("__props")]),
    ch.gCtxId,
    ch.pCtxId
  ];

  path.set("params", updatedParams);
  path
    .get("body")
    .unshiftContainer("body", [
      ch.initComponentContext(id, updatedParams[0], true),
      ch.setHooksContext()
    ]);

  path.traverse({
    FunctionExpression: transfromNestedFunctions,
    FunctionDeclaration: transfromNestedFunctions,
    ArrowFunctionExpression: transfromNestedFunctions
  });

  transformComponentInternals(path);
};