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
