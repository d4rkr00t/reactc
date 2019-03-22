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

// Source: https://codesandbox.io/s/6z5q5wj27w
const data = [{
  css: "url(https://images.pexels.com/photos/416430/pexels-photo-416430.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 150
}, {
  css: "url(https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 300
}, {
  css: "url(https://images.pexels.com/photos/911738/pexels-photo-911738.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 300
}, {
  css: "url(https://images.pexels.com/photos/358574/pexels-photo-358574.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 300
}, {
  css: "url(https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 300
}, {
  css: "url(https://images.pexels.com/photos/96381/pexels-photo-96381.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 300
}, {
  css: "url(https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 200
}, {
  css: "url(https://images.pexels.com/photos/227675/pexels-photo-227675.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 300
}, {
  css: "url(https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 200
}, {
  css: "url(https://images.pexels.com/photos/327482/pexels-photo-327482.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 400
}, {
  css: "url(https://images.pexels.com/photos/988872/pexels-photo-988872.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 200
}, {
  css: "url(https://images.pexels.com/photos/249074/pexels-photo-249074.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 150
}, {
  css: "url(https://images.pexels.com/photos/310452/pexels-photo-310452.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 400
}, {
  css: "url(https://images.pexels.com/photos/380337/pexels-photo-380337.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
  height: 200
}].sort(() => Math.random() - Math.random());

function useMedia(queries, values, defaultValue) {
  const match = () => values[queries.findIndex(q => matchMedia(q).matches)] || defaultValue;

  const [value, set] = useState(match);
  useEffect(() => {
    const handler = () => set(match);

    window.addEventListener("resize", handler);
    return () => window.removeEventListener(handler);
  }, []);
  return value;
}

function useMeasure() {
  const ref = useRef();
  const [bounds, set] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  });
  const [ro] = useState(() => new ResizeObserver(([entry]) => set(entry.contentRect)));
  useEffect(() => (ro.observe(ref.current), ro.disconnect), []);
  return [{
    ref
  }, bounds];
}

function App(__props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: __props,
    $: props => {
      App(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  const columns = useMedia(["(min-width: 1500px)", "(min-width: 1000px)", "(min-width: 600px)"], [5, 4, 3], 2);
  const [bind, {
    width
  }] = useMeasure();
  let heights = new Array(columns).fill(0);
  const displayItems = data.map((child, i) => {
    const column = heights.indexOf(Math.min(...heights));
    const xy = [width / columns * column, (heights[column] += child.height) - child.height];
    return { ...child,
      xy,
      width: width / columns,
      height: child.height
    };
  });

  if (__ctx !== __pctx) {
    createElement(__ctx, "g", "div", {
      $: {
        class: "list",
        style: `height:${toPx(Math.max(...heights))}`
      }
    });
    setRef(__ctx, "g", bind.ref);
    renderChildren(__ctx, "g", [displayItems.map(({
      css,
      xy,
      width,
      height
    }) => {
      var __ctx = {};

      __gctx.sHC(__ctx);

      if (__ctx !== __pctx) {
        createElement(__ctx, "e", "div", {
          $: {
            key: css,
            style: `transform:${`translate3d(${xy[0]}px,${xy[1]}px,0)`};width:${toPx(width)};height:${toPx(height)}`
          }
        });
        createElement(__ctx, "f", "div", {
          $: {
            style: `background-image:${css}`
          }
        });
        renderChildren(__ctx, "f");
        renderChildren(__ctx, "e", [__ctx.f]);
        __ctx.$r = __ctx.e;

        __gctx.pHC();

        return __ctx;
      } else {
        let __f__style = `background-image:${css}`;
        __ctx.f.$p.style !== __f__style && setAttr(__ctx.f, "style", __f__style);
        let __e__key = css;
        __ctx.e.$p.key !== __e__key && setAttr(__ctx.e, "key", __e__key);
        let __e__style = `transform:${`translate3d(${xy[0]}px,${xy[1]}px,0)`};width:${toPx(width)};height:${toPx(height)}`;
        __ctx.e.$p.style !== __e__style && setAttr(__ctx.e, "style", __e__style);

        __gctx.pHC();
      }
    })]);
    __ctx.$r = __ctx.g;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "g", [displayItems.map(({
      css,
      xy,
      width,
      height
    }) => {
      var __ctx = {};

      __gctx.sHC(__ctx);

      if (__ctx !== __pctx) {
        createElement(__ctx, "e", "div", {
          $: {
            key: css,
            style: `transform:${`translate3d(${xy[0]}px,${xy[1]}px,0)`};width:${toPx(width)};height:${toPx(height)}`
          }
        });
        createElement(__ctx, "f", "div", {
          $: {
            style: `background-image:${css}`
          }
        });
        renderChildren(__ctx, "f");
        renderChildren(__ctx, "e", [__ctx.f]);
        __ctx.$r = __ctx.e;

        __gctx.pHC();

        return __ctx;
      } else {
        let __f__style = `background-image:${css}`;
        __ctx.f.$p.style !== __f__style && setAttr(__ctx.f, "style", __f__style);
        let __e__key = css;
        __ctx.e.$p.key !== __e__key && setAttr(__ctx.e, "key", __e__key);
        let __e__style = `transform:${`translate3d(${xy[0]}px,${xy[1]}px,0)`};width:${toPx(width)};height:${toPx(height)}`;
        __ctx.e.$p.style !== __e__style && setAttr(__ctx.e, "style", __e__style);

        __gctx.pHC();
      }
    })]);
    let __g__style = `height:${toPx(Math.max(...heights))}`;
    __ctx.g.$p.style !== __g__style && setAttr(__ctx.g, "style", __g__style);
    setRef(__ctx, "g", bind.ref);

    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, App, null);