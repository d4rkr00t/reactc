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

function Date(props, __context) {
  createElement(__context, "e1", "div", {
    class: "date"
  })
  renderChildren(__context.e1, [props.children])
  return __context.e1._;
}

function Button(_ref, __context) {
  var children = _ref.children;
  createElement(__context, "e2", "a", {
    href: "#",
    class: "button"
  })
  renderChildren(__context.e2, [children])
  return __context.e2._;
}

function Title(props, __context) {
  createElement(__context, "e3", "h1", {
    class: "title"
  })
  renderChildren(__context.e3, [props.children])
  return __context.e3._;
}

function Link(_ref2, __context) {
  var href = _ref2.href,
      children = _ref2.children;
  createElement(__context, "e4", "a", {
    href: href || "#"
  })
  renderChildren(__context.e4, [children])
  return __context.e4._;
}

function App(__props, __context) {
  createElement(__context, "e5", "div", {
    class: "App"
  })
  createComponent(__context, "c1", Date, {
    children: ["12 Aug 2016"]
  })
  createElement(__context, "e9", "div", {
    class: "header"
  })
  createElement(__context, "e12", "span", {
    class: "author"
  })
  createComponent(__context, "c3", Link, {
    children: ["Stranger Things: The sound of the Upside Down"]
  })
  createComponent(__context, "c2", Title, {
    children: [__context.c3]
  })
  createElement(__context, "e13", "p", {
    class: "text"
  })
  createComponent(__context, "c4", Button, {
    children: ["Read more"]
  })
  createElement(__context, "e11", "div", {
    class: "content"
  })
  createElement(__context, "e10", "div", {
    class: "data"
  })
  createElement(__context, "e8", "div", {
    class: "wrapper"
  })
  createElement(__context, "e7", "div", {
    class: "card"
  })
  createElement(__context, "e6", "div", {
    class: "row"
  })
  renderChildren(__context.e5, [__context.e6])
  renderChildren(__context.e6, [__context.e7])
  renderChildren(__context.e7, [__context.e8])
  renderChildren(__context.e8, [__context.e9, __context.e10])
  renderChildren(__context.e9, [__context.c1])
  renderChildren(__context.e10, [__context.e11])
  renderChildren(__context.e11, [__context.e12, __context.c2, __context.e13, __context.c4])
  renderChildren(__context.e12, ["Jane Doe"])
  renderChildren(__context.e13, ["The antsy bingers of Netflix will eagerly anticipate the digital release of the Survive soundtrack, out today."])
  return __context.e5._;
}

mount(document.getElementById("app"), createComponent({}, "App", App, null));