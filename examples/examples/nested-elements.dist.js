/**
 * Global Context [GCTX]:
 * Map<Updater, CCTX>
 *
 * Component Context [CCTX]:
 * {
 *   _  => dom element ref
 *   $  => updater function
 *   $p => prev props
 *   $r => root element context
 *   ...rest => children contexts
 * }
 *
 * Element Context [ECTX]:
 * {
 *   _  => dom element ref
 *   $  => updater function
 *   $a => attrs
 * }
 *
 * render((ctx) => CCTX);
 *
 * updater(props, CCTX);
 *
 * createComponent(gCTX, pCTX, localId, Cmp, props)
 *   => pCTX[localId] = CCTX;
 * createElement(pCTX, localId, 'type', attrs)
 *   => pCTX[localId] = ECTX;
 *
 * renderChildren(CCTX/ECTX, parentLocalId, [localId1, localId2, localId3]);
 */

function mount(parent, gctx, cmp, props) {
  let ctx = cmp(props, gctx);
  if (!ctx) return;
  parent.innerHTML = "";
  parent.appendChild(ctx.$r._);
}

function createComponent(gctx, cctx, lid, cmp, props) {
  if (cctx[lid]) {
    if (cctx[lid].$) {
      cctx[lid].$(props);
    }
    return;
  }
  let ctx = cmp(props, gctx);
  cctx[lid] = ctx;
}

function createElement(cctx, lid, type, attrs) {
  if (cctx[lid]) {
    setAttrs(cctx[lid], attrs);
    return;
  }
  let ctx = { _: document.createElement(type), $p: attrs, $h: {} };
  setAttrs(ctx, attrs);
  cctx[lid] = ctx;
}

function setAttr(ctx, name, value) {
  if (name === "style") {
    ctx._.setAttribute(
      name,
      Object.keys(value)
        .map(prop => {
          let val = value[prop];
          return (
            prop.replace(/([A-Z])/g, $1 => "-" + $1.toLowerCase()) +
            ": " +
            (typeof val === "number" ? val + "px" : val)
          );
        })
        .join(";")
    );
  } else if (name.startsWith("on")) {
    let eventName = name.replace("on", "").toLowerCase();
    if (
      eventName === "change" &&
      ctx._.nodeName === "INPUT" &&
      ctx._.type === "text"
    ) {
      eventName = "input";
    }

    if (ctx.$p[name]) {
      ctx._.removeEventListener(eventName, ctx.$p[name]);
    }
    ctx._.addEventListener(eventName, value);
  } else if (name === "value") {
    ctx._.value = value;
  } else if (name === "checked") {
    if (value === false) {
      ctx._.checked = false;
    } else {
      ctx._.checked = true;
    }
  } else {
    ctx._.setAttribute(name, value);
  }

  ctx.$p[name] = value;
}

function setAttrs(ctx, attrs) {
  if (!attrs) return;
  Object.keys(attrs).forEach(key => setAttr(ctx, key, attrs[key]));
  ctx.$p = attrs;
}

function renderChildren(ctx, pid, children, maybeIdx) {
  let parent = ctx[pid]._;
  let idx = maybeIdx || 0;
  let prevChildren = Array.from(parent.childNodes);

  if (!prevChildren.length && !children.length) return;

  children.forEach(child => {
    if (child === null) {
      if (prevChildren[idx]) {
        parent.removeChild(prevChildren[idx]);
        idx++;
      }
      return;
    }
    if (isPrimitiveChild(child)) {
      if (prevChildren[idx]) {
        if (prevChildren[idx].nodeType === 3) {
          if (prevChildren[idx].textContent !== child) {
            prevChildren[idx].textContent = child;
          }
        } else {
          parent.replaceChild(
            document.createTextNode(child),
            prevChildren[idx]
          );
        }
        idx++;
        return;
      } else {
        idx++;
        return parent.appendChild(document.createTextNode(child));
      }
    } else if (Array.isArray(child)) {
      renderChildren({ $r: { _: parent } }, "$r", child, idx);
      idx += child.length;
      return;
    } else {
      let newChild = child.$r
        ? child.$r.$r
          ? child.$r.$r._
          : child.$r._
        : child._;
      if (prevChildren[idx]) {
        if (prevChildren[idx] !== newChild) {
          try {
            parent.replaceChild(newChild, prevChildren[idx]);
          } catch (e) {}
        }
        idx++;
        return;
      } else {
        if (prevChildren[idx]) {
          if (prevChildren[idx] !== newChild) {
            try {
              parent.replaceChild(newChild, prevChildren[idx]);
            } catch (e) {}
          }
          idx++;
          return;
        }
        parent.appendChild(newChild);
        idx++;
        return;
      }
    }
  });

  while (idx < prevChildren.length) {
    if (prevChildren[idx].parentNode) {
      try {
        prevChildren[idx].parentNode.removeChild(prevChildren[idx]);
      } catch (e) {}
    }
    idx++;
  }
}

function isPrimitiveChild(child) {
  return typeof child === "string" || typeof child === "number";
}

let gCtx = (() => {
  let $h = []; // Stack of hooks contexts
  return {
    // Set hooks context
    sHC: ctx => $h.push({ ctx, pos: 0 }),
    // Pop hooks context
    pHC: () => {
      let hc = $h.pop();
      hc.pos = 0;
    },
    // Get hooks context
    gHC: () => $h[$h.length - 1]
  };
})();

let [useState, useEffect] = (() => {
  let stateHooks = new Map();
  function useState(value) {
    let hc = gCtx.gHC();
    let hook = stateHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let val = hook[pos] === undefined ? value : hook[pos];

    hc.pos += 1;
    hook[pos] = val;
    stateHooks.set(hc.ctx, hook);

    return [
      val,
      newVal => {
        let hook = stateHooks.get(hc.ctx) || [];
        hook[pos] = newVal;
        stateHooks.set(hc.ctx, hook);
        if (hc.ctx.$) {
          hc.ctx.$(hc.ctx.$p);
        }
      }
    ];
  }

  let effectHooks = new Map();
  function useEffect(effect) {
    let hc = gCtx.gHC();
    let hook = effectHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let existingHook = hook[pos];
    if (existingHook) {
      existingHook();
    }
    let hookDestroy = effect();
    if (hookDestroy) {
      hook[pos] = hookDestroy;
      effectHooks.set(hc.ctx, hook);
    }
  }

  return [useState, useEffect];
})();

/* END RUNTIME */

// import React from "react";
// import ReactDOM from "react-dom";
function App(__props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: __props,
    $: props => {
      App(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  if (__ctx !== __pctx) {
    createElement(__ctx, "e18", "div", {
      class: "panel"
    });
    createElement(__ctx, "e19", "div", {
      class: "panel__table panel__line"
    });
    createElement(__ctx, "e20", "table");
    createElement(__ctx, "e21", "tr");
    createElement(__ctx, "e22", "td");
    createElement(__ctx, "e23", "span", {
      class: "panel__mute"
    });
    renderChildren(__ctx, "e23", ["Scope:"]);
    renderChildren(__ctx, "e22", [__ctx.e23]);
    createElement(__ctx, "e24", "td", {
      class: "panel__badge-col"
    });
    createElement(__ctx, "e25", "span", {
      class: "panel__badge"
    });
    renderChildren(__ctx, "e25", ["fn"]);
    renderChildren(__ctx, "e24", [__ctx.e25]);
    createElement(__ctx, "e26", "td");
    renderChildren(__ctx, "e26", ["z-entity-gallery__thumbs"]);
    renderChildren(__ctx, "e21", [__ctx.e22, __ctx.e24, __ctx.e26]);
    createElement(__ctx, "e27", "tr");
    createElement(__ctx, "e28", "td");
    renderChildren(__ctx, "e28", []);
    createElement(__ctx, "e29", "td", {
      class: "panel__badge-col"
    });
    createElement(__ctx, "e30", "span", {
      class: "panel__badge -purple"
    });
    renderChildren(__ctx, "e30", ["bem"]);
    renderChildren(__ctx, "e29", [__ctx.e30]);
    createElement(__ctx, "e31", "td");
    createElement(__ctx, "e32", "span", {
      class: "panel__mute"
    });
    renderChildren(__ctx, "e32", ["block:"]);
    createElement(__ctx, "e33", "span", {
      class: "panel__mute"
    });
    renderChildren(__ctx, "e33", [" | elem:"]);
    renderChildren(__ctx, "e31", [__ctx.e32, "z-entity-gallery", __ctx.e33, "image"]);
    renderChildren(__ctx, "e27", [__ctx.e28, __ctx.e29, __ctx.e31]);
    createElement(__ctx, "e34", "tr");
    createElement(__ctx, "e35", "td", {
      colspan: "4",
      class: "panel__table-sep"
    });
    renderChildren(__ctx, "e35", []);
    renderChildren(__ctx, "e34", [__ctx.e35]);
    createElement(__ctx, "e36", "tr");
    createElement(__ctx, "e37", "td");
    createElement(__ctx, "e38", "span", {
      class: "panel__mute"
    });
    renderChildren(__ctx, "e38", ["Parent:"]);
    renderChildren(__ctx, "e37", [__ctx.e38]);
    createElement(__ctx, "e39", "td", {
      class: "panel__badge-col"
    });
    createElement(__ctx, "e40", "span", {
      class: "panel__badge -blue"
    });
    renderChildren(__ctx, "e40", ["P"]);
    renderChildren(__ctx, "e39", [__ctx.e40]);
    createElement(__ctx, "e41", "td");
    renderChildren(__ctx, "e41", ["z-entity-gallery"]);
    renderChildren(__ctx, "e36", [__ctx.e37, __ctx.e39, __ctx.e41]);
    createElement(__ctx, "e42", "tr");
    createElement(__ctx, "e43", "td", {
      colspan: "4",
      class: "panel__table-sep"
    });
    renderChildren(__ctx, "e43", []);
    renderChildren(__ctx, "e42", [__ctx.e43]);
    createElement(__ctx, "e44", "tr");
    createElement(__ctx, "e45", "td");
    createElement(__ctx, "e46", "span", {
      class: "panel__mute"
    });
    renderChildren(__ctx, "e46", ["File:"]);
    renderChildren(__ctx, "e45", [__ctx.e46]);
    createElement(__ctx, "e47", "td", {
      colspan: "2",
      class: "panel__files"
    });
    createElement(__ctx, "e48", "div", {
      class: "panel__file"
    });
    renderChildren(__ctx, "e48", ["contribs/z-entity-search/blocks-deskpad/z-entity-gallery/__thumbs/z-entity-gallery__thumbs.priv.js:22"]);
    renderChildren(__ctx, "e47", [__ctx.e48]);
    renderChildren(__ctx, "e44", [__ctx.e45, __ctx.e47]);
    renderChildren(__ctx, "e20", [__ctx.e21, __ctx.e27, __ctx.e34, __ctx.e36, __ctx.e42, __ctx.e44]);
    renderChildren(__ctx, "e19", [__ctx.e20]);
    renderChildren(__ctx, "e18", [__ctx.e19]);
    __ctx.$r = __ctx.e18;

    __gctx.pHC();

    return __ctx;
  } else {
    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, App, null);