const ALL_TODOS = "all";
const ACTIVE_TODOS = "active";
const COMPLETED_TODOS = "completed";

function uuid() {
  var i, random;
  var uuid = "";

  for (i = 0; i < 32; i++) {
    random = (Math.random() * 16) | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += "-";
    }
    uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16);
  }

  return uuid;
}

function pluralize(count, word) {
  return count === 1 ? word : word + "s";
}

function useTodos() {
  let [todos, updateTodosList] = useState(
    JSON.parse(window.localStorage.getItem("__todos__") || "null") || [
      {
        id: uuid(),
        title: "todo 1",
        completed: false
      },
      {
        id: uuid(),
        title: "todo 2",
        completed: false
      },
      {
        id: uuid(),
        title: "todo 3",
        completed: true
      }
    ]
  );
  return [
    todos,
    newTodos => {
      window.localStorage.setItem("__todos__", JSON.stringify(newTodos));
      updateTodosList(newTodos);
    }
  ];
}

function TodoItem(props) {
  let className = [];
  if (props.todo.completed) {
    className.push("completed");
  }
  if (props.editing) {
    className.push("editing");
  }

  let [inputValue, setInputValue] = useState(props.todo.title);
  let handleSubmit = () => {
    let val = inputValue.trim();
    if (val) {
      props.onSave(val);
    } else {
      props.onDestroy();
    }
  };

  return (
    <li className={className.join(" ")}>
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={props.todo.completed}
          onChange={props.onToggle}
        />
        <label onDoubleClick={props.onEdit}>{props.todo.title}</label>
        <button className="destroy" onClick={props.onDestroy} />
      </div>
      <input
        className="edit"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={e => {
          if (e.which === 27) {
            props.onCancel(event);
            setInputValue(props.todo.title);
          } else if (event.which === 13) {
            handleSubmit();
          }
        }}
      />
    </li>
  );
}

function TodoFooter(props) {
  let activeTodoWord = pluralize(props.count, "item");
  let clearButton = null;

  if (props.completedCount > 0) {
    clearButton = (
      <button className="clear-completed" onClick={props.onClearCompleted}>
        Clear completed
      </button>
    );
  }

  return (
    <footer className="footer">
      <span className="todo-count">
        <strong>{props.count}</strong> {activeTodoWord} left
      </span>
      <ul className="filters">
        <li>
          <a
            href="#/"
            className={props.nowShowing === ALL_TODOS ? "selected" : ""}
          >
            All
          </a>
        </li>
        <li>
          <a
            href="#/active"
            className={props.nowShowing === ACTIVE_TODOS ? "selected" : ""}
          >
            Active
          </a>
        </li>
        <li>
          <a
            href="#/completed"
            className={props.nowShowing === COMPLETED_TODOS ? "selected" : ""}
          >
            Completed
          </a>
        </li>
      </ul>
      {clearButton}
    </footer>
  );
}

function getNowShowingFromHash(hash) {
  switch (hash) {
    case "#/active":
      return ACTIVE_TODOS;
    case "#/completed":
      return COMPLETED_TODOS;
    default:
      return ALL_TODOS;
  }
}

function TodoApp() {
  let [inputValue, setInputValue] = useState("");
  let [nowShowing, setNowShowing] = useState(
    getNowShowingFromHash(window.location.hash)
  );
  let [todos, updateTodosList] = useTodos();
  let [editing, setEditingState] = useState(null);
  useEffect(() => {
    let handler = () => {
      setNowShowing(getNowShowingFromHash(window.location.hash));
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  });

  let shownTodos = todos.filter(function(todo) {
    switch (nowShowing) {
      case ACTIVE_TODOS:
        return !todo.completed;
      case COMPLETED_TODOS:
        return todo.completed;
      default:
        return true;
    }
  }, this);

  let todoItems = shownTodos.map(function(todo, idx) {
    return (
      <TodoItem
        key={todo.id}
        todo={todo}
        editing={editing === todo.id}
        onEdit={() => setEditingState(todo.id)}
        onSave={title => {
          todos.splice(idx, 1, { ...todo, title });
          updateTodosList(todos);
          setEditingState(null);
        }}
        onCancel={() => setEditingState(null)}
        onToggle={() => {
          todos.splice(idx, 1, { ...todo, completed: !todo.completed });
          updateTodosList(todos);
        }}
        onDestroy={() => {
          todos.splice(idx, 1);
          updateTodosList(todos);
        }}
      />
    );
  }, this);

  let activeTodoCount = todos.reduce(function(accum, todo) {
    return todo.completed ? accum : accum + 1;
  }, 0);

  let completedCount = todos.length - activeTodoCount;

  let main = null;
  if (todos.length) {
    main = (
      <section className="main">
        <input
          id="toggle-all"
          className="toggle-all"
          type="checkbox"
          checked={activeTodoCount === 0}
          onChange={() => {
            let completed = todos.every(t => t.completed);
            updateTodosList(todos.map(t => ({ ...t, completed: !completed })));
          }}
        />
        <label htmlFor="toggle-all" />
        <ul className="todo-list">{todoItems}</ul>
      </section>
    );
  }

  let footer = null;
  if (activeTodoCount || completedCount) {
    footer = (
      <TodoFooter
        count={activeTodoCount}
        completedCount={completedCount}
        nowShowing={nowShowing}
        onClearCompleted={() =>
          updateTodosList(todos.filter(t => !t.completed))
        }
      />
    );
  }

  return (
    <div>
      <header className="header">
        <h1>todos</h1>
        <input
          className="new-todo"
          placeholder="What needs to be done?"
          autoFocus={true}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.keyCode !== 13 || !inputValue) return;
            e.preventDefault();
            todos.push({
              id: uuid(),
              title: inputValue,
              completed: false
            });
            updateTodosList(todos);
            setInputValue("");
          }}
        />
      </header>
      {main}
      {footer}
    </div>
  );
}

ReactDOM.render(<TodoApp />, document.getElementById("app"));
