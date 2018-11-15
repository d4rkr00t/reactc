let [useState, useEffect] = (() => {
  let stateHooks = new Map();
  function useState(ctx, cmp, value) {
    return [
      stateHooks.get(ctx) || value,
      newVal => {
        if (!ctx._) {
          stateHooks.delete(ctx);
        }
        stateHooks.set(ctx, newVal);
        ctx._ = cmp(ctx.props, ctx);
      }
    ];
  }

  let effectHooks = new Map();
  function useEffect(ctx, effect) {
    let existingHook = effectHooks.get(ctx);
    if (existingHook) {
      existingHook();
    }

    let hook = effect();
    if (hook) {
      effectHooks.set(ctx, hook);
    }
  }

  return [useState, useEffect];
})();

function mount(container, element) {
  if (element._.parent === container) return;
  container.appendChild(element._);
}

function createElement(ctx, name, type, attrs) {
  ctx[name] = ctx[name] || {};
  let elem = ctx[name]._ || document.createElement(type);

  if (attrs) {
    Object.keys(attrs).forEach(key => {
      if (key === "style") {
        return elem.setAttribute(
          key,
          Object.keys(attrs[key])
            .map(prop => {
              let val = attrs[key][prop];
              return (
                prop.replace(/([A-Z])/g, $1 => "-" + $1.toLowerCase()) +
                ": " +
                (typeof val === "number" ? val + "px" : val)
              );
            })
            .join(";")
        );
      }

      if (key === "onClick") {
        if (ctx[name].click) {
          elem.removeEventListener("click", ctx[name].click);
        }
        elem.addEventListener("click", attrs[key]);
        ctx[name].click = attrs[key];
      }

      elem.setAttribute(key, attrs[key]);
    });
  }

  ctx[name]._ = elem;
  return ctx[name];
}

function createComponent(ctx, name, cmp, props) {
  ctx[name] = ctx[name] || {
    _: null,
    $: () => {
      ctx[name] = undefined;
    },
    props
  };
  ctx[name]._ = cmp(props, ctx[name]);
  ctx[name].props = props;
  return ctx[name];
}

function renderChildren(ctx, children) {
  ctx._.innerHTML = "";

  let fragment = document.createDocumentFragment();
  [].concat(children).forEach(child => {
    if (isPrimitiveChild(child)) {
      return fragment.appendChild(document.createTextNode(child));
    }

    if (Array.isArray(child)) {
      let subFragment = document.createDocumentFragment();
      renderChildren({ _: subFragment }, child);
      return fragment.appendChild(subFragment);
    }

    fragment.appendChild(child._);
  });

  ctx._.appendChild(fragment);
}

function isPrimitiveChild(child) {
  return typeof child === "string" || typeof child === "number";
}

/* END RUNTIME */

function Countdown(props, __context) {
  createElement(__context, "e1", "div")
  renderChildren(__context.e1, [props.children])
  return __context.e1._;
}

function App(__props, __context) {
  var [count, setCount] = useState(__context, App, 0);
  useEffect(__context, function () {
    var timeout = setTimeout(function () {
      return setCount(count + 1);
    }, 1000);
    return () => clearTimeout(timeout);
  });
  createElement(__context, "e2", "div")
  createComponent(__context, "c1", Countdown, {
    children: [count]
  })
  renderChildren(__context.e2, [__context.c1])
  return __context.e2._;
}

mount(document.getElementById("app"), createComponent({}, "App", App, null));