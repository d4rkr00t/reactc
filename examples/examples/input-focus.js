function App() {
  let [value, setValue] = useState("");
  return (
    <div>
      {value.split("").map(item => {
        return <div>{item}</div>;
      })}
      <input
        value={value}
        onChange={e => {
          console.log(e.target.value);
          setValue(e.target.value);
        }}
      />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
