const Countdown = props => <div className="counter">{props.children}</div>;

const App = () => {
  var [count, setCount] = useState(0);

  useEffect(() => {
    var timeout = setTimeout(() => {
      return setCount(count + 1);
    }, 1000);

    return () => clearTimeout(timeout);
  });

  return (
    <div>
      <Countdown>{count}</Countdown>
      <button onClick={() => setCount(count + 1)}>Update counter</button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
