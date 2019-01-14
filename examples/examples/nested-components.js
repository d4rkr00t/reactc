function Date(props) {
  return <div className="date">{props.children}</div>;
}

function Button(props) {
  return (
    <a href="#" className="button">
      {props.children}
    </a>
  );
}

function Title(props) {
  return <h1 className="title">{props.children}</h1>;
}

function Link({ href, children }) {
  return <a href={href || "#"}>{children}</a>;
}

function App() {
  return (
    <div className="App">
      <div className="row">
        <div className="card">
          <div className="wrapper">
            <div className="header">
              <Date>12 Aug 2016</Date>
            </div>
            <div className="data">
              <div className="content">
                <span className="author">Jane Doe</span>
                <Title>
                  <Link>Stranger Things: The sound of the Upside Down</Link>
                </Title>
                <p className="text">
                  The antsy bingers of Netflix will eagerly anticipate the
                  digital release of the Survive soundtrack, out today.
                </p>
                <Button>Read more</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
