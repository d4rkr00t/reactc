/**
 * Source: https://codesandbox.io/s/509jvrqr8n
 */

function useWindowResize() {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const listener = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("resize", listener);
    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  return {
    width,
    height
  };
}

function App() {
  const { width, height } = useWindowResize();
  return (
    <div>
      <h1>
        <span role="img" aria-label="Left Right Arrow">
          ↔️
        </span>{" "}
        width: {width}px
      </h1>
      <h1>
        <span role="img" aria-label="Up Down Arrow">
          ↕️
        </span>{" "}
        height: {height}px
      </h1>
      <p>Resize the window to update the values</p>
    </div>
  );
}

const rootElement = document.getElementById("app");
ReactDOM.render(<App />, rootElement);
