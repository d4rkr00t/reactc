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
    ctx._[name] = Object.keys(value)
      .map(prop => {
        let val = value[prop];
        return (
          prop.replace(/([A-Z])/g, $1 => "-" + $1.toLowerCase()) +
          ": " +
          (typeof val === "number" ? val + "px" : val)
        );
      })
      .join(";");
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
  } else if (["value", "checked", "className"].indexOf(name) >= 0) {
    ctx._[name] = value;
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

function Date(props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: props,
    $: props => {
      Date(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  if (__ctx !== __pctx) {
    createElement(__ctx, "e1", "div", {
      className: "date"
    });
    renderChildren(__ctx, "e1", [props.children]);
    __ctx.$r = __ctx.e1;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "e1", [props.children]);

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
    createElement(__ctx, "e2", "a", {
      href: "#",
      className: "button"
    });
    renderChildren(__ctx, "e2", [props.children]);
    __ctx.$r = __ctx.e2;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "e2", [props.children]);

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
    createElement(__ctx, "e3", "h1", {
      className: "title"
    });
    renderChildren(__ctx, "e3", [props.children]);
    __ctx.$r = __ctx.e3;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "e3", [props.children]);

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
    createElement(__ctx, "e4", "a", {
      href: href || "#"
    });
    renderChildren(__ctx, "e4", [children]);
    __ctx.$r = __ctx.e4;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "e4", [children]);

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
    createElement(__ctx, "e5", "div", {
      className: "App"
    });
    createElement(__ctx, "e6", "div", {
      className: "row"
    });
    createElement(__ctx, "e7", "div", {
      className: "card"
    });
    createElement(__ctx, "e8", "div", {
      className: "wrapper"
    });
    createElement(__ctx, "e9", "div", {
      className: "header"
    });
    createComponent(__gctx, __ctx, "c1", Date, {
      children: "12 Aug 2016"
    });
    renderChildren(__ctx, "e9", [__ctx.c1]);
    createElement(__ctx, "e10", "div", {
      className: "data"
    });
    createElement(__ctx, "e11", "div", {
      className: "content"
    });
    createElement(__ctx, "e12", "span", {
      className: "author"
    });
    renderChildren(__ctx, "e12", ["Jane Doe"]);
    createComponent(__gctx, __ctx, "c3", Link, {
      children: "Stranger Things: The sound of the Upside Down"
    });
    createComponent(__gctx, __ctx, "c2", Title, {
      children: __ctx.c3
    });
    createElement(__ctx, "e13", "p", {
      className: "text"
    });
    renderChildren(__ctx, "e13", ["The antsy bingers of Netflix will eagerly anticipate the digital release of the Survive soundtrack, out today."]);
    createComponent(__gctx, __ctx, "c4", Button, {
      children: "Read more"
    });
    renderChildren(__ctx, "e11", [__ctx.e12, __ctx.c2, __ctx.e13, __ctx.c4]);
    renderChildren(__ctx, "e10", [__ctx.e11]);
    renderChildren(__ctx, "e8", [__ctx.e9, __ctx.e10]);
    renderChildren(__ctx, "e7", [__ctx.e8]);
    renderChildren(__ctx, "e6", [__ctx.e7]);
    renderChildren(__ctx, "e5", [__ctx.e6]);
    __ctx.$r = __ctx.e5;

    __gctx.pHC();

    return __ctx;
  } else {
    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, App, null);