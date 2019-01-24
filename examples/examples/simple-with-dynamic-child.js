function DynamicChild(props) {
  let dog;
  if (props.render) {
    dog = <div className={props.className}>dog</div>;
  }
  return (
    <div>
      {dog}
      <div>cat</div>
    </div>
  );
}

function App() {
  let [render, setRender] = useState(true);
  return (
    <div>
      <DynamicChild render={render} className="bigdog" />
      <button onClick={() => setRender(!render)}>Re-render</button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
