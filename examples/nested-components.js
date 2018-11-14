function Date(props) {
  return React.createElement("div", { className: "date" }, props.children);
}

function Button(_ref) {
  var children = _ref.children;

  return React.createElement("a", { href: "#", className: "button" }, children);
}

function Title(props) {
  return React.createElement("h1", { className: "title" }, props.children);
}

function Link(_ref2) {
  var href = _ref2.href,
    children = _ref2.children;

  return React.createElement("a", { href: href || "#" }, children);
}

function App() {
  return React.createElement(
    "div",
    { className: "App" },
    React.createElement(
      "div",
      { className: "row" },
      React.createElement(
        "div",
        { className: "card" },
        React.createElement(
          "div",
          { className: "wrapper" },
          React.createElement(
            "div",
            { className: "header" },
            React.createElement(Date, null, "12 Aug 2016")
          ),
          React.createElement(
            "div",
            { className: "data" },
            React.createElement(
              "div",
              { className: "content" },
              React.createElement("span", { className: "author" }, "Jane Doe"),
              React.createElement(
                Title,
                null,
                React.createElement(
                  Link,
                  null,
                  "Stranger Things: The sound of the Upside Down"
                )
              ),
              React.createElement(
                "p",
                { className: "text" },
                "The antsy bingers of Netflix will eagerly anticipate the digital release of the Survive soundtrack, out today."
              ),
              React.createElement(Button, null, "Read more")
            )
          )
        )
      )
    )
  );
}

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));
