function Date(props, __context) {
  let __el_1 = createElement("div", {
    class: "date"
  });

  renderChildren(__el_1, [props.children])
  return __el_1;
}

function Button(_ref, __context) {
  var children = _ref.children;

  let __el_2 = createElement("a", {
    href: "#",
    class: "button"
  });

  renderChildren(__el_2, [children])
  return __el_2;
}

function Title(props, __context) {
  let __el_3 = createElement("h1", {
    class: "title"
  });

  renderChildren(__el_3, [props.children])
  return __el_3;
}

function Link(_ref2, __context) {
  var href = _ref2.href,
      children = _ref2.children;

  let __el_4 = createElement("a", {
    href: href || "#"
  });

  renderChildren(__el_4, [children])
  return __el_4;
}

function App(__context) {
  let __el_5 = createElement("div", {
    class: "App"
  });

  let __cmp_1 = Date({
    children: ["12 Aug 2016"]
  });

  let __el_9 = createElement("div", {
    class: "header"
  });

  let __el_12 = createElement("span", {
    class: "author"
  });

  let __cmp_3 = Link({
    children: ["Stranger Things: The sound of the Upside Down"]
  });

  let __cmp_2 = Title({
    children: [__cmp_3]
  });

  let __el_13 = createElement("p", {
    class: "text"
  });

  let __cmp_4 = Button({
    children: ["Read more"]
  });

  let __el_11 = createElement("div", {
    class: "content"
  });

  let __el_10 = createElement("div", {
    class: "data"
  });

  let __el_8 = createElement("div", {
    class: "wrapper"
  });

  let __el_7 = createElement("div", {
    class: "card"
  });

  let __el_6 = createElement("div", {
    class: "row"
  });

  renderChildren(__el_5, [__el_6])
  renderChildren(__el_6, [__el_7])
  renderChildren(__el_7, [__el_8])
  renderChildren(__el_8, [__el_9, __el_10])
  renderChildren(__el_9, [__cmp_1])
  renderChildren(__el_10, [__el_11])
  renderChildren(__el_11, [__el_12, __cmp_2, __el_13, __cmp_4])
  renderChildren(__el_12, ["Jane Doe"])
  renderChildren(__el_13, ["The antsy bingers of Netflix will eagerly anticipate the digital release of the Survive soundtrack, out today."])
  return __el_5;
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
