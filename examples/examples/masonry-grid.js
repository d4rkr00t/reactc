// Source: https://codesandbox.io/s/6z5q5wj27w

const data = [
  {
    css:
      "url(https://images.pexels.com/photos/416430/pexels-photo-416430.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 150
  },
  {
    css:
      "url(https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 300
  },
  {
    css:
      "url(https://images.pexels.com/photos/911738/pexels-photo-911738.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 300
  },
  {
    css:
      "url(https://images.pexels.com/photos/358574/pexels-photo-358574.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 300
  },
  {
    css:
      "url(https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 300
  },
  {
    css:
      "url(https://images.pexels.com/photos/96381/pexels-photo-96381.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 300
  },
  {
    css:
      "url(https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 200
  },
  {
    css:
      "url(https://images.pexels.com/photos/227675/pexels-photo-227675.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 300
  },
  {
    css:
      "url(https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 200
  },
  {
    css:
      "url(https://images.pexels.com/photos/327482/pexels-photo-327482.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 400
  },
  {
    css:
      "url(https://images.pexels.com/photos/988872/pexels-photo-988872.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 200
  },
  {
    css:
      "url(https://images.pexels.com/photos/249074/pexels-photo-249074.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 150
  },
  {
    css:
      "url(https://images.pexels.com/photos/310452/pexels-photo-310452.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 400
  },
  {
    css:
      "url(https://images.pexels.com/photos/380337/pexels-photo-380337.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)",
    height: 200
  }
].sort(() => Math.random() - Math.random());

function useMedia(queries, values, defaultValue) {
  const match = () =>
    values[queries.findIndex(q => matchMedia(q).matches)] || defaultValue;
  const [value, set] = useState(match);
  useEffect(() => {
    const handler = () => set(match);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener(handler);
  }, []);
  return value;
}

function useMeasure() {
  const ref = useRef();
  const [bounds, set] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [ro] = useState(
    () => new ResizeObserver(([entry]) => set(entry.contentRect))
  );
  useEffect(() => (ro.observe(ref.current), ro.disconnect), []);
  return [{ ref }, bounds];
}

function App() {
  const columns = useMedia(
    ["(min-width: 1500px)", "(min-width: 1000px)", "(min-width: 600px)"],
    [5, 4, 3],
    2
  );
  const [bind, { width }] = useMeasure();

  let heights = new Array(columns).fill(0);
  const displayItems = data.map((child, i) => {
    const column = heights.indexOf(Math.min(...heights));
    const xy = [
      (width / columns) * column,
      (heights[column] += child.height) - child.height
    ];
    return { ...child, xy, width: width / columns, height: child.height };
  });

  return (
    <div ref={bind.ref} class="list" style={{ height: Math.max(...heights) }}>
      {displayItems.map(({ css, xy, width, height }) => (
        <div
          key={css}
          style={{
            transform: `translate3d(${xy[0]}px,${xy[1]}px,0)`,
            width,
            height
          }}
        >
          <div style={{ backgroundImage: css }} />
        </div>
      ))}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
