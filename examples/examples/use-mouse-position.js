/**
 * Source: https://codepen.io/halvves/pen/qQxPNo
 */

const useMousePosition = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const onMouse = ({ clientX, clientY }) => {
    setMouse({ x: clientX, y: clientY });
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouse);

    return () => {
      window.removeEventListener("mousemove", onMouse);
    };
  });

  return mouse;
};

function App() {
  const { x, y } = useMousePosition();

  return (
    <div
      className="m"
      style={{
        left: `${x}px`,
        top: `${y}px`
      }}
    >
      x: {x}, y: {y}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
