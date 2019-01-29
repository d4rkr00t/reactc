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

function Date(props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: props,
    $: props => {
      Date(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  if (__ctx !== __pctx) {
    createElement(__ctx, "e4", "div", {
      $: {
        class: "date"
      }
    });
    renderChildren(__ctx, "e4", [props.children]);
    __ctx.$r = __ctx.e4;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "e4", [props.children]);

    __gctx.pHC();
  }
}

function Button(props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: props,
    $: props => {
      Button(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  if (__ctx !== __pctx) {
    createElement(__ctx, "e5", "a", {
      $: {
        href: "#",
        class: "button"
      }
    });
    renderChildren(__ctx, "e5", [props.children]);
    __ctx.$r = __ctx.e5;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "e5", [props.children]);

    __gctx.pHC();
  }
}

function Title(props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: props,
    $: props => {
      Title(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  if (__ctx !== __pctx) {
    createElement(__ctx, "e6", "h1", {
      $: {
        class: "title"
      }
    });
    renderChildren(__ctx, "e6", [props.children]);
    __ctx.$r = __ctx.e6;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "e6", [props.children]);

    __gctx.pHC();
  }
}

function Link({
  href,
  children
}, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: {
      href,
      children
    },
    $: props => {
      Link(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  if (__ctx !== __pctx) {
    createElement(__ctx, "e7", "a", {
      $: {
        href: href || "#"
      }
    });
    renderChildren(__ctx, "e7", [children]);
    __ctx.$r = __ctx.e7;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "e7", [children]);

    __gctx.pHC();
  }
}

function App(__props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: __props,
    $: props => {
      App(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  if (__ctx !== __pctx) {
    createElement(__ctx, "e8", "div", {
      $: {
        class: "App"
      }
    });
    createElement(__ctx, "e9", "div", {
      $: {
        class: "row"
      }
    });
    createElement(__ctx, "e10", "div", {
      $: {
        class: "card"
      }
    });
    createElement(__ctx, "e11", "div", {
      $: {
        class: "wrapper"
      }
    });
    createElement(__ctx, "e12", "div", {
      $: {
        class: "header"
      }
    });
    createComponent(__gctx, __ctx, "c1", Date, {
      children: "12 Aug 2016"
    });
    renderChildren(__ctx, "e12", [__ctx.c1]);
    createElement(__ctx, "e13", "div", {
      $: {
        class: "data"
      }
    });
    createElement(__ctx, "e14", "div", {
      $: {
        class: "content"
      }
    });
    createElement(__ctx, "e15", "span", {
      $: {
        class: "author"
      }
    });
    renderChildren(__ctx, "e15", ["Jane Doe"]);
    createComponent(__gctx, __ctx, "c3", Link, {
      children: "Stranger Things: The sound of the Upside Down"
    });
    createComponent(__gctx, __ctx, "c2", Title, {
      children: __ctx.c3
    });
    createElement(__ctx, "e16", "p", {
      $: {
        class: "text"
      }
    });
    renderChildren(__ctx, "e16", ["The antsy bingers of Netflix will eagerly anticipate the digital release of the Survive soundtrack, out today."]);
    createComponent(__gctx, __ctx, "c4", Button, {
      children: "Read more"
    });
    renderChildren(__ctx, "e14", [__ctx.e15, __ctx.c2, __ctx.e16, __ctx.c4]);
    renderChildren(__ctx, "e13", [__ctx.e14]);
    renderChildren(__ctx, "e11", [__ctx.e12, __ctx.e13]);
    renderChildren(__ctx, "e10", [__ctx.e11]);
    renderChildren(__ctx, "e9", [__ctx.e10]);
    renderChildren(__ctx, "e8", [__ctx.e9]);
    __ctx.$r = __ctx.e8;

    __gctx.pHC();

    return __ctx;
  } else {
    __ctx.c2.$({
      children: __ctx.c3
    });

    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, App, null);