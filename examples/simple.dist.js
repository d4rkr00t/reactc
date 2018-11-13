function App(__props, __context) {
  let __el_1 = createElement("div");

  renderChildren(__el_1, ["Hello ReactC"])
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
