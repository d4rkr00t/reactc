function Date(__props, __context) {
  let __el_1 = createElement("div", {
    class: "date"
  });

  let __el_2 = createElement("span", {
    class: "day"
  });

  let __el_3 = createElement("span", {
    class: "month"
  });

  let __el_4 = createElement("span", {
    class: "year"
  });

  renderChildren(__el_1, [__el_2, __el_3, __el_4])
  renderChildren(__el_2, ["12 "])
  renderChildren(__el_3, ["Aug "])
  renderChildren(__el_4, ["2016"])
  return __el_1;
}

function Button(__props, __context) {
  let __el_5 = createElement("a", {
    href: "#",
    class: "button"
  });

  renderChildren(__el_5, ["Read more"])
  return __el_5;
}

function App(__props, __context) {
  let __el_6 = createElement("div", {
    class: "App"
  });

  let __el_7 = createElement("div", {
    class: "row"
  });

  let __el_8 = createElement("div", {
    class: "card"
  });

  let __el_9 = createElement("div", {
    class: "wrapper"
  });

  let __el_10 = createElement("div", {
    class: "header"
  });

  let __cmp_11 = Date();

  let __el_12 = createElement("div", {
    class: "data"
  });

  let __el_13 = createElement("div", {
    class: "content"
  });

  let __el_14 = createElement("span", {
    class: "author"
  });

  let __el_15 = createElement("h1", {
    class: "title"
  });

  let __el_16 = createElement("a", {
    href: "#"
  });

  let __el_17 = createElement("p", {
    class: "text"
  });

  let __cmp_18 = Button();

  renderChildren(__el_6, [__el_7])
  renderChildren(__el_7, [__el_8])
  renderChildren(__el_8, [__el_9])
  renderChildren(__el_9, [__el_10, __el_12])
  renderChildren(__el_10, [__cmp_11])
  renderChildren(__el_12, [__el_13])
  renderChildren(__el_13, [__el_14, __el_15, __el_17, __cmp_18])
  renderChildren(__el_14, ["Jane Doe"])
  renderChildren(__el_15, [__el_16])
  renderChildren(__el_16, ["Stranger Things: The sound of the Upside Down"])
  renderChildren(__el_17, ["The antsy bingers of Netflix will eagerly anticipate the digital release of the Survive soundtrack, out today."])
  return __el_6;
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
