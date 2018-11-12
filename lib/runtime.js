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
