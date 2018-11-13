function Date() {
  return React.createElement(
    "div",
    { className: "date" },
    React.createElement("span", { className: "day" }, "12 "),
    React.createElement("span", { className: "month" }, "Aug "),
    React.createElement("span", { className: "year" }, "2016")
  );
}

function Button() {
  return React.createElement(
    "a",
    { href: "#", className: "button" },
    "Read more"
  );
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
            React.createElement(Date, null)
          ),
          React.createElement(
            "div",
            { className: "data" },
            React.createElement(
              "div",
              { className: "content" },
              React.createElement("span", { className: "author" }, "Jane Doe"),
              React.createElement(
                "h1",
                { className: "title" },
                React.createElement(
                  "a",
                  { href: "#" },
                  "Stranger Things: The sound of the Upside Down"
                )
              ),
              React.createElement(
                "p",
                { className: "text" },
                "The antsy bingers of Netflix will eagerly anticipate the digital release of the Survive soundtrack, out today."
              ),
              React.createElement(Button, null)
            )
          )
        )
      )
    )
  );
}

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));
