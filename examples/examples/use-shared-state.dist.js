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

/**
 * Source: https://codesandbox.io/s/y3n57mlwvj
 */
const createSharedState = defaultValue => {
  let listeners = [];

  const setSharedState = value => {
    listeners.forEach(listener => listener(value));
  };

  return () => {
    const [value, setVal] = useState(defaultValue);
    useEffect(() => {
      listeners.push(setVal);
      return () => {
        listeners.splice(-1, 1);
      };
    });
    return [value, setSharedState];
  };
};

const useSharedState = createSharedState(0);

function Child(__props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: __props,
    $: props => {
      Child(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  const [value, setValue] = useSharedState();

  const onIncrement = () => {
    setValue(value + 1);
  };

  const onDecrement = () => {
    setValue(value - 1);
  };

  if (__ctx !== __pctx) {
    createElement(__ctx, "cv", "div");
    createElement(__ctx, "cw", "div");
    createElement(__ctx, "cx", "button", {
      $e: {
        click: onIncrement
      }
    });
    renderChildren(__ctx, "cx", ["+"]);
    createElement(__ctx, "cy", "button", {
      $e: {
        click: onDecrement
      }
    });
    renderChildren(__ctx, "cy", ["-"]);
    renderChildren(__ctx, "cw", [__ctx.cx, __ctx.cy]);
    renderChildren(__ctx, "cv", [value, __ctx.cw]);
    __ctx.$r = __ctx.cv;

    __gctx.pHC();

    return __ctx;
  } else {
    let __cx__click = onIncrement;
    __ctx.cx.$p.click !== __cx__click && setEvt(__ctx.cx, "click", __cx__click);
    let __cy__click = onDecrement;
    __ctx.cy.$p.click !== __cy__click && setEvt(__ctx.cy, "click", __cy__click);
    renderChildren(__ctx, "cv", [value, __ctx.cw]);

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

  const [value, setValue] = useSharedState();

  const onIncrement = () => {
    setValue(value + 1);
  };

  const onDecrement = () => {
    setValue(value - 1);
  };

  if (__ctx !== __pctx) {
    createElement(__ctx, "cz", "div");
    createElement(__ctx, "da", "div");
    createElement(__ctx, "db", "button", {
      $e: {
        click: onIncrement
      }
    });
    renderChildren(__ctx, "db", ["+"]);
    createElement(__ctx, "dc", "button", {
      $e: {
        click: onDecrement
      }
    });
    renderChildren(__ctx, "dc", ["-"]);
    renderChildren(__ctx, "da", [__ctx.db, __ctx.dc]);
    createComponent(__gctx, __ctx, "dd", Child);
    renderChildren(__ctx, "cz", [value, __ctx.da, __ctx.dd]);
    __ctx.$r = __ctx.cz;

    __gctx.pHC();

    return __ctx;
  } else {
    let __db__click = onIncrement;
    __ctx.db.$p.click !== __db__click && setEvt(__ctx.db, "click", __db__click);
    let __dc__click = onDecrement;
    __ctx.dc.$p.click !== __dc__click && setEvt(__ctx.dc, "click", __dc__click);

    __ctx.dd.$();

    renderChildren(__ctx, "cz", [value, __ctx.da, __ctx.dd]);

    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, App, null);