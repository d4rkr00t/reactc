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

function toPx(val) {
  return typeof val === "number" ? val + "px" : val;
}

function appendChild(p, c) {
  p.appendChild(c);
}

function mount(parent, gctx, cmp, props) {
  let ctx = cmp(props, gctx);
  if (!ctx) return;
  parent.innerHTML = "";
  appendChild(parent, ctx.$r._);
  return ctx;
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
  if (value) {
    ctx._.setAttribute(name, value);
  } else {
    ctx._.removeAttribute(name);
  }
  ctx.$p[name] = value;
}

function setProp(ctx, name, value) {
  ctx._[name] = value;
  ctx.$p[name] = value;
}

function setEvt(ctx, name, value) {
  if (ctx.$p[name]) {
    ctx._.removeEventListener(name, ctx.$p[name]);
  }
  ctx._.addEventListener(name, value);
  ctx.$p[name] = value;
}

function setRef(ctx, name, value) {
  value.current = ctx[name]._;
}

function setAttrs(ctx, attrs) {
  if (!attrs) return;
  if (attrs.$)
    Object.keys(attrs.$).forEach(key => setAttr(ctx, key, attrs.$[key]));
  if (attrs.$e)
    Object.keys(attrs.$e).forEach(key => setEvt(ctx, key, attrs.$e[key]));
  if (attrs.$p)
    Object.keys(attrs.$p).forEach(key => setProp(ctx, key, attrs.$p[key]));
  ctx.$p = attrs;
}

function renderChildren(ctx, pid, children, maybeIdx) {
  let parent = ctx[pid]._;
  let idx = maybeIdx || 0;
  let prevChildren = Array.from(parent.childNodes);
  let isEmpty = !prevChildren.length;

  if (!children || (!prevChildren.length && !children.length)) return idx;

  let flatChildren = children.reduce((acc, i) => acc.concat(i), []);
  let nodesToKeep = new WeakSet();

  flatChildren.forEach(child => {
    if (child === null || child === undefined) {
      return;
    }

    let isPrimitive = isPrimitiveChild(child);
    let childElem = isPrimitive
      ? document.createTextNode(child)
      : child.$r
      ? child.$r.$r
        ? child.$r.$r._
        : child.$r._
      : child._;
    let childIdx = prevChildren.indexOf(childElem);
    let prevChild = prevChildren[idx];

    // input | c0 |
    //
    // 1     | c1 | c0 | 0
    // input | c0 |    | +1
    //
    // 1     | c1 | c1, c0 | +1
    // 2     | c2 |        | 0
    // input | c0 |        | +1

    if (childElem === null || childElem === undefined) {
      return;
    }

    if (isEmpty) {
      isEmpty = false;
      nodesToKeep.add(childElem);
      return appendChild(parent, childElem);
    } else if (childIdx === -1 && prevChild && !isPrimitive) {
      nodesToKeep.add(childElem);
      return parent.insertBefore(childElem, prevChild);
    } else if (isPrimitive && prevChild && prevChild.nodeType === 3) {
      prevChild.textContent = child;
      idx++;
      nodesToKeep.add(prevChild);
      return;
    } else if (prevChildren[childIdx] === childElem) {
      idx++;
      nodesToKeep.add(childElem);
      return;
    } else if (!prevChild) {
      nodesToKeep.add(childElem);
      return appendChild(parent, childElem);
    }
  });

  prevChildren.forEach(child => {
    if (!nodesToKeep.has(child)) {
      parent.removeChild(child);
    }
  });
}

function isPrimitiveChild(child) {
  return typeof child === "string" || typeof child === "number";
}

let gCtx = (() => {
  let $h = []; // Stack of hooks contexts
  return {
    // Set hooks context
    sHC: ctx => $h.push({ ctx, pos: 0, effects: [] }),
    // Pop hooks context
    pHC: () => {
      let hc = $h.pop();
      hc.pos = 0;
      hc.effects.forEach(eff => eff());
      hc.effects = [];
    },
    // Get hooks context
    gHC: () => $h[$h.length - 1]
  };
})();

let compareArrays = (arr1 = [], arr2 = []) => {
  if (arr1.length !== arr2.length) return false;
  if (!arr1.length && !arr2.length) return true;
  return arr1.every((item, idx) => item === arr2[idx]);
};

let [useState, useEffect, useRef] = (() => {
  let stateHooks = new Map();
  function useState(value) {
    let hc = gCtx.gHC();
    let hook = stateHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let val =
      hook[pos] === undefined
        ? typeof value === "function"
          ? value()
          : value
        : hook[pos];

    hc.pos += 1;
    hook[pos] = val;
    stateHooks.set(hc.ctx, hook);

    return [
      val,
      newVal => {
        let hook = stateHooks.get(hc.ctx) || [];
        hook[pos] = typeof newVal === "function" ? newVal(hook[pos]) : newVal;
        stateHooks.set(hc.ctx, hook);
        if (hc.ctx.$) {
          hc.ctx.$(hc.ctx.$p);
        }
      }
    ];
  }

  let effectHooks = new Map();
  function useEffect(effect, cache) {
    let hc = gCtx.gHC();
    let hook = effectHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let existingHook = hook[pos];
    hc.pos += 1;
    if (
      existingHook &&
      Array.isArray(cache) &&
      (compareArrays(existingHook.cache, cache) || !cache.length)
    ) {
      return;
    }

    hook[pos] = { cache };
    effectHooks.set(hc.ctx, hook);

    hc.effects.push(() => {
      if (existingHook && existingHook.hookDestroy) {
        existingHook.hookDestroy();
      }
      let hookDestroy = effect();
      let hook = effectHooks.get(hc.ctx) || [];
      hook[pos] = { hookDestroy, cache };
      effectHooks.set(hc.ctx, hook);
    });
  }

  let refHooks = new Map();
  function useRef(initialValue) {
    let hc = gCtx.gHC();
    let hook = refHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let existingRef = hook[pos];
    hc.pos += 1;
    if (existingRef) {
      return existingRef;
    }
    hook[pos] = { current: initialValue };
    refHooks.set(hc.ctx, hook);
    return hook[pos];
  }

  return [useState, useEffect, useRef];
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
    createElement(__ctx, "ac", "div", {
      $: {
        class: "panel"
      }
    });
    createElement(__ctx, "ad", "div", {
      $: {
        class: "panel__table panel__line"
      }
    });
    createElement(__ctx, "ae", "table");
    createElement(__ctx, "af", "tr");
    createElement(__ctx, "ag", "td");
    createElement(__ctx, "ah", "span", {
      $: {
        class: "panel__mute"
      }
    });
    renderChildren(__ctx, "ah", ["Scope:"]);
    renderChildren(__ctx, "ag", [__ctx.ah]);
    createElement(__ctx, "ai", "td", {
      $: {
        class: "panel__badge-col"
      }
    });
    createElement(__ctx, "aj", "span", {
      $: {
        class: "panel__badge"
      }
    });
    renderChildren(__ctx, "aj", ["fn"]);
    renderChildren(__ctx, "ai", [__ctx.aj]);
    createElement(__ctx, "ak", "td");
    renderChildren(__ctx, "ak", ["z-entity-gallery__thumbs"]);
    renderChildren(__ctx, "af", [__ctx.ag, __ctx.ai, __ctx.ak]);
    createElement(__ctx, "al", "tr");
    createElement(__ctx, "am", "td");
    renderChildren(__ctx, "am");
    createElement(__ctx, "an", "td", {
      $: {
        class: "panel__badge-col"
      }
    });
    createElement(__ctx, "ao", "span", {
      $: {
        class: "panel__badge -purple"
      }
    });
    renderChildren(__ctx, "ao", ["bem"]);
    renderChildren(__ctx, "an", [__ctx.ao]);
    createElement(__ctx, "ap", "td");
    createElement(__ctx, "aq", "span", {
      $: {
        class: "panel__mute"
      }
    });
    renderChildren(__ctx, "aq", ["block:"]);
    createElement(__ctx, "ar", "span", {
      $: {
        class: "panel__mute"
      }
    });
    renderChildren(__ctx, "ar", [" | elem:"]);
    renderChildren(__ctx, "ap", [__ctx.aq, "z-entity-gallery", __ctx.ar, "image"]);
    renderChildren(__ctx, "al", [__ctx.am, __ctx.an, __ctx.ap]);
    createElement(__ctx, "as", "tr");
    createElement(__ctx, "at", "td", {
      $: {
        colspan: "4",
        class: "panel__table-sep"
      }
    });
    renderChildren(__ctx, "at");
    renderChildren(__ctx, "as", [__ctx.at]);
    createElement(__ctx, "au", "tr");
    createElement(__ctx, "av", "td");
    createElement(__ctx, "aw", "span", {
      $: {
        class: "panel__mute"
      }
    });
    renderChildren(__ctx, "aw", ["Parent:"]);
    renderChildren(__ctx, "av", [__ctx.aw]);
    createElement(__ctx, "ax", "td", {
      $: {
        class: "panel__badge-col"
      }
    });
    createElement(__ctx, "ay", "span", {
      $: {
        class: "panel__badge -blue"
      }
    });
    renderChildren(__ctx, "ay", ["P"]);
    renderChildren(__ctx, "ax", [__ctx.ay]);
    createElement(__ctx, "az", "td");
    renderChildren(__ctx, "az", ["z-entity-gallery"]);
    renderChildren(__ctx, "au", [__ctx.av, __ctx.ax, __ctx.az]);
    createElement(__ctx, "ba", "tr");
    createElement(__ctx, "bb", "td", {
      $: {
        colspan: "4",
        class: "panel__table-sep"
      }
    });
    renderChildren(__ctx, "bb");
    renderChildren(__ctx, "ba", [__ctx.bb]);
    createElement(__ctx, "bc", "tr");
    createElement(__ctx, "bd", "td");
    createElement(__ctx, "be", "span", {
      $: {
        class: "panel__mute"
      }
    });
    renderChildren(__ctx, "be", ["File:"]);
    renderChildren(__ctx, "bd", [__ctx.be]);
    createElement(__ctx, "bf", "td", {
      $: {
        colspan: "2",
        class: "panel__files"
      }
    });
    createElement(__ctx, "bg", "div", {
      $: {
        class: "panel__file"
      }
    });
    renderChildren(__ctx, "bg", ["contribs/z-entity-search/blocks-deskpad/z-entity-gallery/__thumbs/z-entity-gallery__thumbs.priv.js:22"]);
    renderChildren(__ctx, "bf", [__ctx.bg]);
    renderChildren(__ctx, "bc", [__ctx.bd, __ctx.bf]);
    renderChildren(__ctx, "ae", [__ctx.af, __ctx.al, __ctx.as, __ctx.au, __ctx.ba, __ctx.bc]);
    renderChildren(__ctx, "ad", [__ctx.ae]);
    renderChildren(__ctx, "ac", [__ctx.ad]);
    __ctx.$r = __ctx.ac;

    __gctx.pHC();

    return __ctx;
  } else {
    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, App, null);