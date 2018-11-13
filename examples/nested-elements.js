// import React from "react";
// import ReactDOM from "react-dom";

function App() {
  return React.createElement(
    "div",
    { className: "panel" },
    React.createElement(
      "div",
      { className: "panel__table panel__line" },
      React.createElement(
        "table",
        null,
        React.createElement(
          "tr",
          null,
          React.createElement(
            "td",
            null,
            React.createElement("span", { className: "panel__mute" }, "Scope:")
          ),
          React.createElement(
            "td",
            { className: "panel__badge-col" },
            React.createElement("span", { className: "panel__badge" }, "fn")
          ),
          React.createElement("td", null, "z-entity-gallery__thumbs")
        ),
        React.createElement(
          "tr",
          null,
          React.createElement("td", null),
          React.createElement(
            "td",
            { className: "panel__badge-col" },
            React.createElement(
              "span",
              { className: "panel__badge -purple" },
              "bem"
            )
          ),
          React.createElement(
            "td",
            null,
            React.createElement("span", { className: "panel__mute" }, "block:"),
            "z-entity-gallery",
            React.createElement(
              "span",
              { className: "panel__mute" },
              " | elem:"
            ),
            "image"
          )
        ),
        React.createElement(
          "tr",
          null,
          React.createElement("td", {
            colspan: "4",
            className: "panel__table-sep"
          })
        ),
        React.createElement(
          "tr",
          null,
          React.createElement(
            "td",
            null,
            React.createElement("span", { className: "panel__mute" }, "Parent:")
          ),
          React.createElement(
            "td",
            { className: "panel__badge-col" },
            React.createElement(
              "span",
              { className: "panel__badge -blue" },
              "P"
            )
          ),
          React.createElement("td", null, "z-entity-gallery")
        ),
        React.createElement(
          "tr",
          null,
          React.createElement("td", {
            colspan: "4",
            className: "panel__table-sep"
          })
        ),
        React.createElement(
          "tr",
          null,
          React.createElement(
            "td",
            null,
            React.createElement("span", { className: "panel__mute" }, "File:")
          ),
          React.createElement(
            "td",
            { colspan: "2", className: "panel__files" },
            React.createElement(
              "div",
              { className: "panel__file" },
              "contribs/z-entity-search/blocks-deskpad/z-entity-gallery/__thumbs/z-entity-gallery__thumbs.priv.js:22"
            )
          )
        )
      )
    )
  );
}

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));
