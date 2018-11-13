let colors = [
  "#a6e22e",
  "#a1efe4",
  "#66d9ef",
  "#ae81ff",
  "#cc6633",
  "#4CAF50",
  "#00BCD4",
  "#5C6BC0"
];

function App() {
  return React.createElement(
    "div",
    { className: "barchart" },
    colors.map(function(color) {
      var height = Math.floor(Math.random() * (140 - 80 + 1)) + 60;
      return React.createElement(
        "div",
        { className: "barchart__bar-wrapper" },
        React.createElement(
          "div",
          { className: "barchart__bar-title", style: { color } },
          height
        ),
        React.createElement("div", {
          className: "barchart__bar",
          style: {
            backgroundColor: color,
            height
          }
        })
      );
    })
  );
}

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));
