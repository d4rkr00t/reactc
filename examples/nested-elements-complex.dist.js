let colors = ["#a6e22e", "#a1efe4", "#66d9ef", "#ae81ff", "#cc6633", "#4CAF50", "#00BCD4", "#5C6BC0"];

function App(__props, __context) {
  let __el_1 = createElement("div", {
    class: "barchart"
  });

  renderChildren(__el_1, [colors.map(function (color) {
    var height = Math.floor(Math.random() * (140 - 80 + 1)) + 60;

    let __el_2 = createElement("div", {
      class: "barchart__bar-wrapper"
    });

    let __el_3 = createElement("div", {
      class: "barchart__bar-title",
      style: {
        color
      }
    });

    let __el_4 = createElement("div", {
      class: "barchart__bar",
      style: {
        backgroundColor: color,
        height
      }
    });

    renderChildren(__el_2, [__el_3, __el_4])
    renderChildren(__el_3, [height])
    return __el_2;
  })])
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
            .map(prop =>
              [
                prop.replace(/([A-Z])/g, $1 => "-" + $1.toLowerCase()),
                ": ",
                typeof attrs[key][prop] === "number"
                  ? attrs[key][prop] + "px"
                  : attrs[key][prop]
              ].join("")
            )
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
      child.forEach(subChild => {
        if (isPrimitiveChild(subChild)) {
          return subFragment.appendChild(document.createTextNode(subChild));
        }

        subFragment.appendChild(subChild);
      });

      return fragment.appendChild(subFragment);
    }

    fragment.appendChild(child);
  });

  root.appendChild(fragment);
}
