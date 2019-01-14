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
  return (
    <div className="barchart">
      {colors.map((color, idx) => {
        var height = (idx / colors.length) * 140 + 60;
        return (
          <div className="barchart__bar-wrapper">
            <div className="barchart__bar-title" style={{ color }}>
              {height}
            </div>
            <div
              className="barchart__bar"
              style={{
                backgroundColor: color,
                height
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));
