let { types: t } = require("@babel/core");
let { CTX, GCTX, PCTX } = require("./consts");
let isFunction = require("../utils/checks/is-function");
let ctxId = t.identifier(CTX);
let gCtxId = t.identifier(GCTX);
let pCtxId = t.identifier(PCTX);

function identifier(id) {
  return t.isIdentifier(id) ? id : t.identifier(id);
}

function memberExpression(objName, propName, ...rest) {
  return rest.reduce((acc, arg) => {
    return t.memberExpression(acc, identifier(arg));
  }, t.memberExpression(identifier(objName), identifier(propName)));
}

function contextProperty(id) {
  return memberExpression(CTX, id);
}

/**
 * __ctx.id.$p.prop
 */
function contextElementProperty(id, prop) {
  return t.memberExpression(
    t.memberExpression(
      t.memberExpression(ctxId, t.identifier(id)),
      t.identifier("$p")
    ),
    prop,
    t.isStringLiteral(prop) ? true : false
  );
}

/**
 * __ctx.id.$
 */
function contextElementUpdater(id) {
  return memberExpression(CTX, id, "$");
}

function setRef(id, ref) {
  return t.expressionStatement(
    t.callExpression(
      t.identifier("setRef"),
      [ctxId, t.stringLiteral(id), ref.value].filter(Boolean)
    )
  );
}

/**
 * createElement(__ctx, "id", "type", { ...props });
 */
function createElement(id, type, props) {
  return t.expressionStatement(
    t.callExpression(
      t.identifier("createElement"),
      [ctxId, t.stringLiteral(id), t.stringLiteral(type), props].filter(Boolean)
    )
  );
}

/**
 * createComponent(__gctx, __ctx, "b", Countdown, { children: count });
 */
function createComponent(id, type, props) {
  return t.expressionStatement(
    t.callExpression(
      t.identifier("createComponent"),
      [gCtxId, ctxId, t.stringLiteral(id), t.identifier(type), props].filter(
        Boolean
      )
    )
  );
}

/**
 * renderChildren(__ctx, 'a', [props.children]);
 * renderChildren(__ctx, 'a', [ctx.b, ctx.c, "some text"]);
 */
function renderChildren(id, children) {
  let processedChildren = children.filter(Boolean);
  return processedChildren.length
    ? t.expressionStatement(
        t.callExpression(t.identifier("renderChildren"), [
          ctxId,
          t.stringLiteral(id),
          t.arrayExpression(processedChildren)
        ])
      )
    : t.expressionStatement(
        t.callExpression(t.identifier("renderChildren"), [
          ctxId,
          t.stringLiteral(id)
        ])
      );
}

/**
 * var __ctx = { $p: props };
 */
function initComponentContext(id, props, withPctx) {
  let properties = [];
  if (props) {
    properties.push(t.objectProperty(t.identifier("$p"), props));
  }

  if (id) {
    properties.push(
      t.objectProperty(
        t.identifier("$"),
        t.arrowFunctionExpression(
          [t.identifier("props")],
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(id, [t.identifier("props"), gCtxId, ctxId])
            )
          ])
        )
      )
    );
  }

  return withPctx
    ? t.variableDeclaration("var", [
        t.variableDeclarator(
          ctxId,
          t.logicalExpression("||", pCtxId, t.objectExpression(properties))
        )
      ])
    : t.variableDeclaration("var", [
        t.variableDeclarator(ctxId, t.objectExpression(properties))
      ]);
}

function setHooksContext() {
  return t.expressionStatement(
    t.callExpression(memberExpression(GCTX, "sHC"), [ctxId])
  );
}

function popHooksContext() {
  return t.expressionStatement(
    t.callExpression(memberExpression(GCTX, "pHC"), [])
  );
}

function setAttr(id, type, key, value) {
  let typeToSetter = {
    attributes: "setAttr",
    eventHandlers: "setEvt",
    properties: "setProp"
  };
  let fn = typeToSetter[type];
  if (!fn) return [];

  if (isFunction(value)) {
    return [
      t.expressionStatement(
        t.callExpression(t.identifier(fn), [
          contextProperty(id),
          t.stringLiteral(key.name),
          value
        ])
      )
    ];
  }

  let newValId = t.identifier("__" + id + "__" + key.name);
  return [
    t.variableDeclaration("let", [
      t.variableDeclarator(newValId, t.cloneNode(value))
    ]),
    t.expressionStatement(
      t.logicalExpression(
        "&&",
        t.binaryExpression("!==", contextElementProperty(id, key), newValId),
        t.callExpression(t.identifier(fn), [
          contextProperty(id),
          t.isIdentifier(key) ? t.stringLiteral(key.name) : key,
          newValId
        ])
      )
    )
  ];
}

/**
 * __ctx.$r = __ctx.id;
 */
function setRootElement(id) {
  return t.expressionStatement(
    t.assignmentExpression("=", contextProperty("$r"), contextProperty(id))
  );
}

/**
 * if (__ctx !== __pCtx) {
 *   ...renderPath
 * } else {
 *   ...updatePath
 * }
 */
function createRenderUpdate(renderPath, updatePath) {
  return t.ifStatement(
    t.binaryExpression("!==", ctxId, pCtxId),
    t.blockStatement(renderPath),
    t.blockStatement([...updatePath, popHooksContext()])
  );
}

module.exports = {
  memberExpression,
  contextProperty,
  contextElementProperty,
  ctxId,
  gCtxId,
  pCtxId,
  createElement,
  createComponent,
  renderChildren,
  initComponentContext,
  setHooksContext,
  popHooksContext,
  setRef,
  setAttr,
  setRootElement,
  contextElementUpdater,
  createRenderUpdate
};
