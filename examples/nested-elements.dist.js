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

// import React from "react";
// import ReactDOM from "react-dom";
function App(__props, __context) {
  createElement(__context, "e1", "div", {
    class: "panel"
  })
  createElement(__context, "e6", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e5", "td")
  createElement(__context, "e8", "span", {
    class: "panel__badge"
  })
  createElement(__context, "e7", "td", {
    class: "panel__badge-col"
  })
  createElement(__context, "e9", "td")
  createElement(__context, "e4", "tr")
  createElement(__context, "e11", "td")
  createElement(__context, "e13", "span", {
    class: "panel__badge -purple"
  })
  createElement(__context, "e12", "td", {
    class: "panel__badge-col"
  })
  createElement(__context, "e15", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e16", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e14", "td")
  createElement(__context, "e10", "tr")
  createElement(__context, "e18", "td", {
    colspan: "4",
    class: "panel__table-sep"
  })
  createElement(__context, "e17", "tr")
  createElement(__context, "e21", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e20", "td")
  createElement(__context, "e23", "span", {
    class: "panel__badge -blue"
  })
  createElement(__context, "e22", "td", {
    class: "panel__badge-col"
  })
  createElement(__context, "e24", "td")
  createElement(__context, "e19", "tr")
  createElement(__context, "e26", "td", {
    colspan: "4",
    class: "panel__table-sep"
  })
  createElement(__context, "e25", "tr")
  createElement(__context, "e29", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e28", "td")
  createElement(__context, "e31", "div", {
    class: "panel__file"
  })
  createElement(__context, "e30", "td", {
    colspan: "2",
    class: "panel__files"
  })
  createElement(__context, "e27", "tr")
  createElement(__context, "e3", "table")
  createElement(__context, "e2", "div", {
    class: "panel__table panel__line"
  })
  renderChildren(__context.e1, [__context.e2])
  renderChildren(__context.e2, [__context.e3])
  renderChildren(__context.e3, [__context.e4, __context.e10, __context.e17, __context.e19, __context.e25, __context.e27])
  renderChildren(__context.e4, [__context.e5, __context.e7, __context.e9])
  renderChildren(__context.e5, [__context.e6])
  renderChildren(__context.e6, ["Scope:"])
  renderChildren(__context.e7, [__context.e8])
  renderChildren(__context.e8, ["fn"])
  renderChildren(__context.e9, ["z-entity-gallery__thumbs"])
  renderChildren(__context.e10, [__context.e11, __context.e12, __context.e14])
  renderChildren(__context.e12, [__context.e13])
  renderChildren(__context.e13, ["bem"])
  renderChildren(__context.e14, [__context.e15, "z-entity-gallery", __context.e16, "image"])
  renderChildren(__context.e15, ["block:"])
  renderChildren(__context.e16, [" | elem:"])
  renderChildren(__context.e17, [__context.e18])
  renderChildren(__context.e19, [__context.e20, __context.e22, __context.e24])
  renderChildren(__context.e20, [__context.e21])
  renderChildren(__context.e21, ["Parent:"])
  renderChildren(__context.e22, [__context.e23])
  renderChildren(__context.e23, ["P"])
  renderChildren(__context.e24, ["z-entity-gallery"])
  renderChildren(__context.e25, [__context.e26])
  renderChildren(__context.e27, [__context.e28, __context.e30])
  renderChildren(__context.e28, [__context.e29])
  renderChildren(__context.e29, ["File:"])
  renderChildren(__context.e30, [__context.e31])
  renderChildren(__context.e31, ["contribs/z-entity-search/blocks-deskpad/z-entity-gallery/__thumbs/z-entity-gallery__thumbs.priv.js:22"])
  return __context.e1._;
}

mount(document.getElementById("app"), createComponent({}, "App", App, null));