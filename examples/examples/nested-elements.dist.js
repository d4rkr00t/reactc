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
  createElement(__context, "e18", "div", {
    class: "panel"
  })
  createElement(__context, "e23", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e22", "td")
  createElement(__context, "e25", "span", {
    class: "panel__badge"
  })
  createElement(__context, "e24", "td", {
    class: "panel__badge-col"
  })
  createElement(__context, "e26", "td")
  createElement(__context, "e21", "tr")
  createElement(__context, "e28", "td")
  createElement(__context, "e30", "span", {
    class: "panel__badge -purple"
  })
  createElement(__context, "e29", "td", {
    class: "panel__badge-col"
  })
  createElement(__context, "e32", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e33", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e31", "td")
  createElement(__context, "e27", "tr")
  createElement(__context, "e35", "td", {
    colspan: "4",
    class: "panel__table-sep"
  })
  createElement(__context, "e34", "tr")
  createElement(__context, "e38", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e37", "td")
  createElement(__context, "e40", "span", {
    class: "panel__badge -blue"
  })
  createElement(__context, "e39", "td", {
    class: "panel__badge-col"
  })
  createElement(__context, "e41", "td")
  createElement(__context, "e36", "tr")
  createElement(__context, "e43", "td", {
    colspan: "4",
    class: "panel__table-sep"
  })
  createElement(__context, "e42", "tr")
  createElement(__context, "e46", "span", {
    class: "panel__mute"
  })
  createElement(__context, "e45", "td")
  createElement(__context, "e48", "div", {
    class: "panel__file"
  })
  createElement(__context, "e47", "td", {
    colspan: "2",
    class: "panel__files"
  })
  createElement(__context, "e44", "tr")
  createElement(__context, "e20", "table")
  createElement(__context, "e19", "div", {
    class: "panel__table panel__line"
  })
  renderChildren(__context.e18, [__context.e19])
  renderChildren(__context.e19, [__context.e20])
  renderChildren(__context.e20, [__context.e21, __context.e27, __context.e34, __context.e36, __context.e42, __context.e44])
  renderChildren(__context.e21, [__context.e22, __context.e24, __context.e26])
  renderChildren(__context.e22, [__context.e23])
  renderChildren(__context.e23, ["Scope:"])
  renderChildren(__context.e24, [__context.e25])
  renderChildren(__context.e25, ["fn"])
  renderChildren(__context.e26, ["z-entity-gallery__thumbs"])
  renderChildren(__context.e27, [__context.e28, __context.e29, __context.e31])
  renderChildren(__context.e29, [__context.e30])
  renderChildren(__context.e30, ["bem"])
  renderChildren(__context.e31, [__context.e32, "z-entity-gallery", __context.e33, "image"])
  renderChildren(__context.e32, ["block:"])
  renderChildren(__context.e33, [" | elem:"])
  renderChildren(__context.e34, [__context.e35])
  renderChildren(__context.e36, [__context.e37, __context.e39, __context.e41])
  renderChildren(__context.e37, [__context.e38])
  renderChildren(__context.e38, ["Parent:"])
  renderChildren(__context.e39, [__context.e40])
  renderChildren(__context.e40, ["P"])
  renderChildren(__context.e41, ["z-entity-gallery"])
  renderChildren(__context.e42, [__context.e43])
  renderChildren(__context.e44, [__context.e45, __context.e47])
  renderChildren(__context.e45, [__context.e46])
  renderChildren(__context.e46, ["File:"])
  renderChildren(__context.e47, [__context.e48])
  renderChildren(__context.e48, ["contribs/z-entity-search/blocks-deskpad/z-entity-gallery/__thumbs/z-entity-gallery__thumbs.priv.js:22"])
  return __context.e18._;
}

mount(document.getElementById("app"), createComponent({}, "App", App, null));