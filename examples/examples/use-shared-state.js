/**
 * Source: https://codesandbox.io/s/y3n57mlwvj
 */

const createSharedState = defaultValue => {
  let listeners = [];

  const setSharedState = value => {
    listeners.forEach(listener => listener(value));
  };

  return () => {
    const [value, setVal] = useState(defaultValue);
    useEffect(() => {
      listeners.push(setVal);
      return () => {
        listeners.splice(-1, 1);
      };
    });
    return [value, setSharedState];
  };
};

const useSharedState = createSharedState(0);

function Child() {
  const [value, setValue] = useSharedState();

  const onIncrement = () => {
    setValue(value + 1);
  };

  const onDecrement = () => {
    setValue(value - 1);
  };

  return (
    <div>
      {value}
      <div>
        <button onClick={onIncrement}>+</button>
        <button onClick={onDecrement}>-</button>
      </div>
    </div>
  );
}

function App() {
  const [value, setValue] = useSharedState();

  const onIncrement = () => {
    setValue(value + 1);
  };

  const onDecrement = () => {
    setValue(value - 1);
  };

  return (
    <div>
      {value}
      <div>
        <button onClick={onIncrement}>+</button>
        <button onClick={onDecrement}>-</button>
      </div>
      <Child />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
