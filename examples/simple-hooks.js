function Countdown(props) {
  return React.createElement("div", null, props.children);
}

function App() {
  var [count, setCount] = useState(__context, App, 0);

  useEffect(__context, function() {
    var timeout = setTimeout(function() {
      return setCount(count + 1);
    }, 1000);

    return () => clearTimeout(timeout);
  });

  return React.createElement(
    "div",
    null,
    React.createElement(Countdown, null, count)
  );
}

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));
