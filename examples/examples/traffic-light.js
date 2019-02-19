/**
 * Source: https://codesandbox.io/s/xlw615w7ow
 */

const lightDurations = [5000, 4000, 1000];

const Light = ({ color, active }) => (
  <div
    className="light"
    style={{ backgroundColor: color, opacity: active ? 1 : 0.4 }}
  />
);

const TrafficLight = ({ initialValue }) => {
  const [colorIndex, setColorIndex] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setColorIndex((colorIndex + 1) % 3);
    }, lightDurations[colorIndex]);
    return () => clearTimeout(timer);
  }, [colorIndex]);

  return (
    <div className="traffic-light">
      <Light color="#f00" active={colorIndex === 0} />
      <Light color="#ff0" active={colorIndex === 2} />
      <Light color="#0c0" active={colorIndex === 1} />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <TrafficLight initialValue={0} />
      <TrafficLight initialValue={1} />
    </div>
  );
}

const rootElement = document.getElementById("app");
ReactDOM.render(<App />, rootElement);
