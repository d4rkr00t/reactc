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
      (existingHook && compareArrays(existingHook.cache, cache)) ||
      (existingHook && Array.isArray(cache) && !cache.length)
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

/**
 * Source: https://codepen.io/halvves/pen/aPmxWK
 */
const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState([]);
  const synth = useRef();

  const updateVoices = () => {
    setVoices(synth.current.getVoices());
  };

  const speak = (text, voice, pitch = 1, rate = 1) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.pitch = pitch;
    utterance.rate = rate;
    synth.current.speak(utterance);
  };

  useEffect(() => {
    if (typeof window !== "object" || !window.speechSynthesis) return;
    synth.current = window.speechSynthesis;
    synth.current.onvoiceschanged = updateVoices;
    updateVoices();
    return () => {
      synth.current.onvoiceschanged = null;
    };
  }, []);
  return [voices, speak];
};

const App = (__props, __gctx, __pctx) => {
  var __ctx = __pctx || {
    $p: __props,
    $: props => {
      App(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  const [voices, speak] = useSpeechSynthesis();
  const [currentVoice, setCurrentVoice] = useState();
  const [text, setText] = useState("may i have some hooks, please");
  useEffect(() => {
    if (!currentVoice) {
      setCurrentVoice(voices.filter(v => v.default)[0] || voices[0]);
    }
  }, [voices]);

  const handleVoiceChange = e => {
    setCurrentVoice(voices.filter(v => v.name === e.target.value)[0]);
  };

  const handleTextChange = e => {
    setText(e.target.value);
  };

  const handleSpeak = e => {
    e.preventDefault();
    speak(text, currentVoice);
  };

  if (__ctx !== __pctx) {
    createElement(__ctx, "dr", "form", {
      $: {
        class: "contain"
      },
      $e: {
        submit: handleSpeak
      }
    });
    createElement(__ctx, "ds", "div", {
      $: {
        class: "select"
      }
    });
    createElement(__ctx, "dt", "select", {
      $e: {
        change: handleVoiceChange
      }
    });
    renderChildren(__ctx, "dt", [voices.map(v => {
      var __ctx = {};

      __gctx.sHC(__ctx);

      if (__ctx !== __pctx) {
        createElement(__ctx, "dq", "option", {
          $p: {
            value: v.name,
            selected: currentVoice && currentVoice.name === v.name
          }
        });
        renderChildren(__ctx, "dq", [`${v.name}`]);
        __ctx.$r = __ctx.dq;

        __gctx.pHC();

        return __ctx;
      } else {
        renderChildren(__ctx, "dq", [`${v.name}`]);
        let __dq__value = v.name;
        __ctx.dq.$p.value !== __dq__value && setProp(__ctx.dq, "value", __dq__value);

        __gctx.pHC();
      }
    })]);
    renderChildren(__ctx, "ds", [__ctx.dt]);
    createElement(__ctx, "du", "input", {
      $: {
        type: "text"
      },
      $e: {
        input: handleTextChange
      },
      $p: {
        value: text
      }
    });
    renderChildren(__ctx, "du");
    createElement(__ctx, "dv", "button", {
      $: {
        type: "submit"
      }
    });
    renderChildren(__ctx, "dv", ["\uD83D\uDDE3"]);
    renderChildren(__ctx, "dr", [__ctx.ds, __ctx.du, __ctx.dv]);
    __ctx.$r = __ctx.dr;

    __gctx.pHC();

    return __ctx;
  } else {
    renderChildren(__ctx, "dt", [voices.map(v => {
      var __ctx = {};

      __gctx.sHC(__ctx);

      if (__ctx !== __pctx) {
        createElement(__ctx, "dq", "option", {
          $p: {
            value: v.name,
            selected: currentVoice && currentVoice.name === v.name
          }
        });
        renderChildren(__ctx, "dq", [`${v.name}`]);
        __ctx.$r = __ctx.dq;

        __gctx.pHC();

        return __ctx;
      } else {
        renderChildren(__ctx, "dq", [`${v.name}`]);
        let __dq__value = v.name;
        __ctx.dq.$p.value !== __dq__value && setProp(__ctx.dq, "value", __dq__value);

        __gctx.pHC();
      }
    })]);
    let __dt__change = handleVoiceChange;
    __ctx.dt.$p.change !== __dt__change && setEvt(__ctx.dt, "change", __dt__change);
    let __du__value = text;
    __ctx.du.$p.value !== __du__value && setProp(__ctx.du, "value", __du__value);
    let __du__input = handleTextChange;
    __ctx.du.$p.input !== __du__input && setEvt(__ctx.du, "input", __du__input);
    let __dr__submit = handleSpeak;
    __ctx.dr.$p.submit !== __dr__submit && setEvt(__ctx.dr, "submit", __dr__submit);

    __gctx.pHC();
  }
};

mount(document.getElementById("app"), gCtx, App, null);