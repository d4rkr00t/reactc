// import React from "react";
// import ReactDOM from "react-dom";
function App(__props, __context) {
  let __el1 = createElement("div", {
    class: "panel"
  });

  let __el2 = createElement("div", {
    class: "panel__table panel__line"
  });

  let __el3 = createElement("table");

  let __el4 = createElement("tr");

  let __el5 = createElement("td");

  let __el6 = createElement("span", {
    class: "panel__mute"
  });

  let __el7 = createElement("td", {
    class: "panel__badge-col"
  });

  let __el8 = createElement("span", {
    class: "panel__badge"
  });

  let __el9 = createElement("td");

  let __el10 = createElement("tr");

  let __el11 = createElement("td");

  let __el12 = createElement("td", {
    class: "panel__badge-col"
  });

  let __el13 = createElement("span", {
    class: "panel__badge -purple"
  });

  let __el14 = createElement("td");

  let __el15 = createElement("span", {
    class: "panel__mute"
  });

  let __el16 = createElement("span", {
    class: "panel__mute"
  });

  let __el17 = createElement("tr");

  let __el18 = createElement("td", {
    colspan: "4",
    class: "panel__table-sep"
  });

  let __el19 = createElement("tr");

  let __el20 = createElement("td");

  let __el21 = createElement("span", {
    class: "panel__mute"
  });

  let __el22 = createElement("td", {
    class: "panel__badge-col"
  });

  let __el23 = createElement("span", {
    class: "panel__badge -blue"
  });

  let __el24 = createElement("td");

  let __el25 = createElement("tr");

  let __el26 = createElement("td", {
    colspan: "4",
    class: "panel__table-sep"
  });

  let __el27 = createElement("tr");

  let __el28 = createElement("td");

  let __el29 = createElement("span", {
    class: "panel__mute"
  });

  let __el30 = createElement("td", {
    colspan: "2",
    class: "panel__files"
  });

  let __el31 = createElement("div", {
    class: "panel__file"
  });

  render(__context.__root, __el1, [[__el2, [[__el3, [[__el4, [[__el5, [[__el6, ["Scope:"]]]], [__el7, [[__el8, ["fn"]]]], [__el9, ["z-entity-gallery__thumbs"]]]], [__el10, [[__el11, []], [__el12, [[__el13, ["bem"]]]], [__el14, [[__el15, ["block:"]], "z-entity-gallery", [__el16, [" | elem:"]], "image"]]]], [__el17, [[__el18, []]]], [__el19, [[__el20, [[__el21, ["Parent:"]]]], [__el22, [[__el23, ["P"]]]], [__el24, ["z-entity-gallery"]]]], [__el25, [[__el26, []]]], [__el27, [[__el28, [[__el29, ["File:"]]]], [__el30, [[__el31, ["contribs/z-entity-search/blocks-deskpad/z-entity-gallery/__thumbs/z-entity-gallery__thumbs.priv.js:22"]]]]]]]]]]]);
}

App(null, {
  __root: document.getElementById("app")
});


function createElement(type, attrs) {
  let elem = document.createElement(type);

  if (attrs) {
    Object.keys(attrs).map(key => {
      elem.setAttribute(key, attrs[key]);
    });
  }

  return elem;
}

function render(root, elem, children) {
  if (typeof elem === "string") {
    root.appendChild(document.createTextNode(elem));
    return;
  }

  let parent = children.length > 1 ? document.createDocumentFragment() : elem;
  children.forEach(child =>
    typeof child === "string"
      ? render(parent, child)
      : render(parent, child[0], child[1])
  );

  if (elem !== parent) {
    elem.appendChild(parent);
  }

  root.appendChild(elem);
}
