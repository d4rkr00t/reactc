// import React from "react";
// import ReactDOM from "react-dom";
function App(__context) {
  let __el_1 = createElement("div", {
    class: "panel"
  });

  let __el_6 = createElement("span", {
    class: "panel__mute"
  });

  let __el_5 = createElement("td");

  let __el_8 = createElement("span", {
    class: "panel__badge"
  });

  let __el_7 = createElement("td", {
    class: "panel__badge-col"
  });

  let __el_9 = createElement("td");

  let __el_4 = createElement("tr");

  let __el_11 = createElement("td");

  let __el_13 = createElement("span", {
    class: "panel__badge -purple"
  });

  let __el_12 = createElement("td", {
    class: "panel__badge-col"
  });

  let __el_15 = createElement("span", {
    class: "panel__mute"
  });

  let __el_16 = createElement("span", {
    class: "panel__mute"
  });

  let __el_14 = createElement("td");

  let __el_10 = createElement("tr");

  let __el_18 = createElement("td", {
    colspan: "4",
    class: "panel__table-sep"
  });

  let __el_17 = createElement("tr");

  let __el_21 = createElement("span", {
    class: "panel__mute"
  });

  let __el_20 = createElement("td");

  let __el_23 = createElement("span", {
    class: "panel__badge -blue"
  });

  let __el_22 = createElement("td", {
    class: "panel__badge-col"
  });

  let __el_24 = createElement("td");

  let __el_19 = createElement("tr");

  let __el_26 = createElement("td", {
    colspan: "4",
    class: "panel__table-sep"
  });

  let __el_25 = createElement("tr");

  let __el_29 = createElement("span", {
    class: "panel__mute"
  });

  let __el_28 = createElement("td");

  let __el_31 = createElement("div", {
    class: "panel__file"
  });

  let __el_30 = createElement("td", {
    colspan: "2",
    class: "panel__files"
  });

  let __el_27 = createElement("tr");

  let __el_3 = createElement("table");

  let __el_2 = createElement("div", {
    class: "panel__table panel__line"
  });

  renderChildren(__el_1, [__el_2])
  renderChildren(__el_2, [__el_3])
  renderChildren(__el_3, [__el_4, __el_10, __el_17, __el_19, __el_25, __el_27])
  renderChildren(__el_4, [__el_5, __el_7, __el_9])
  renderChildren(__el_5, [__el_6])
  renderChildren(__el_6, ["Scope:"])
  renderChildren(__el_7, [__el_8])
  renderChildren(__el_8, ["fn"])
  renderChildren(__el_9, ["z-entity-gallery__thumbs"])
  renderChildren(__el_10, [__el_11, __el_12, __el_14])
  renderChildren(__el_12, [__el_13])
  renderChildren(__el_13, ["bem"])
  renderChildren(__el_14, [__el_15, "z-entity-gallery", __el_16, "image"])
  renderChildren(__el_15, ["block:"])
  renderChildren(__el_16, [" | elem:"])
  renderChildren(__el_17, [__el_18])
  renderChildren(__el_19, [__el_20, __el_22, __el_24])
  renderChildren(__el_20, [__el_21])
  renderChildren(__el_21, ["Parent:"])
  renderChildren(__el_22, [__el_23])
  renderChildren(__el_23, ["P"])
  renderChildren(__el_24, ["z-entity-gallery"])
  renderChildren(__el_25, [__el_26])
  renderChildren(__el_27, [__el_28, __el_30])
  renderChildren(__el_28, [__el_29])
  renderChildren(__el_29, ["File:"])
  renderChildren(__el_30, [__el_31])
  renderChildren(__el_31, ["contribs/z-entity-search/blocks-deskpad/z-entity-gallery/__thumbs/z-entity-gallery__thumbs.priv.js:22"])
  return __el_1;
}

renderChildren(document.getElementById("app"), [App(null)]);


function createElement(type, attrs) {
  let elem = document.createElement(type);

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

      elem.setAttribute(key, attrs[key]);
    });
  }

  return elem;
}

function isPrimitiveChild(child) {
  return typeof child === "string" || typeof child === "number";
}

function renderChildren(root, children) {
  let fragment = document.createDocumentFragment();
  children.forEach(child => {
    if (isPrimitiveChild(child)) {
      return fragment.appendChild(document.createTextNode(child));
    }

    if (Array.isArray(child)) {
      let subFragment = document.createDocumentFragment();
      renderChildren(subFragment, child);
      return fragment.appendChild(subFragment);
    }

    fragment.appendChild(child);
  });

  root.appendChild(fragment);
}
