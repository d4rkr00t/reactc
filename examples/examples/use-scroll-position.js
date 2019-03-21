// Source: https://codepen.io/halvves/pen/oQdLbQ

let hasPassiveSupport = undefined;
getHasPassiveEventSupport = () => {
  if (typeof hasPassiveSupport === "boolean") {
    return hasPassiveSupport;
  }

  hasPassiveSupport = false;

  try {
    const opts = Object.defineProperty({}, "passive", {
      get() {
        hasPassiveSupport = true;
        return hasPassiveSupport;
      }
    });

    window.addEventListener("test", null, opts);
  } catch (e) {
    hasPassiveSupport = false;
  }

  return hasPassiveSupport;
};

const useScrollPosition = () => {
  const [scroll, setScroll] = useState({ x: 0, y: 0 });
  const tickingRef = useRef();

  const handleScroll = () => {
    setScroll({
      x: window.pageXOffset,
      y: window.pageYOffset
    });
    tickingRef.current = false;
  };

  onScroll = () => {
    if (tickingRef.current) {
      return;
    }

    tickingRef.current = true;
    window.requestAnimationFrame(handleScroll);
  };

  useEffect(() => {
    window.addEventListener(
      "scroll",
      onScroll,
      getHasPassiveEventSupport() ? { passive: true } : false
    );

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  });

  return scroll;
};

const App = () => {
  const { x, y } = useScrollPosition();

  return (
    <div className="d">
      x: {x.toFixed(0)}, y: {y.toFixed(0)}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
