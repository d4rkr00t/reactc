/**
 * Global Context [GCTX]:
 * Map<Updater, CCTX>
 *
 * Component Context [CCTX]:
 * {
 *   _  => dom element ref
 *   $  => updater function
 *   $p => prev props
 *   $r => root element context
 *   ...rest => children contexts
 * }
 *
 * Element Context [ECTX]:
 * {
 *   _  => dom element ref
 *   $  => updater function
 *   $a => attrs
 * }
 *
 * render((ctx) => CCTX);
 *
 * updater(props, CCTX);
 *
 * createComponent(gCTX, pCTX, localId, Cmp, props)
 *   => pCTX[localId] = CCTX;
 * createElement(pCTX, localId, 'type', attrs)
 *   => pCTX[localId] = ECTX;
 *
 * renderChildren(CCTX/ECTX, parentLocalId, [localId1, localId2, localId3]);
 */

function mount(parent, gctx, cmp, props) {
  let ctx = cmp(props, gctx);
  if (!ctx) return;
  parent.innerHTML = "";
  parent.appendChild(ctx.$r._);
  return ctx;
}

function createComponent(gctx, cctx, lid, cmp, props) {
  if (cctx[lid]) {
    if (cctx[lid].$) {
      cctx[lid].$(props);
    }
    return;
  }
  let ctx = cmp(props, gctx);
  cctx[lid] = ctx;
}

function createElement(cctx, lid, type, attrs) {
  if (cctx[lid]) {
    setAttrs(cctx[lid], attrs);
    return;
  }
  let ctx = { _: document.createElement(type), $p: attrs, $h: {} };
  setAttrs(ctx, attrs);
  cctx[lid] = ctx;
}

function setAttr(ctx, name, value) {
  if (name === "style") {
    ctx._[name] = Object.keys(value)
      .map(prop => {
        let val = value[prop];
        let cleanPropName = prop.replace(
          /([A-Z])/g,
          $1 => "-" + $1.toLowerCase()
        );
        return (
          cleanPropName +
          ": " +
          (typeof val === "number" &&
          ["opacity", "flex", "z-index"].indexOf(cleanPropName) === -1 &&
          !cleanPropName.match(/^--/)
            ? val + "px"
            : "" + val)
        );
      })
      .join(";");
  } else if (name.startsWith("on")) {
    let eventName = name.replace("on", "").toLowerCase();
    if (
      eventName === "change" &&
      ctx._.nodeName === "INPUT" &&
      ctx._.type === "text"
    ) {
      eventName = "input";
    }

    if (ctx.$p[name]) {
      ctx._.removeEventListener(eventName, ctx.$p[name]);
    }
    ctx._.addEventListener(eventName, value);
  } else if (["value", "checked", "className"].indexOf(name) >= 0) {
    ctx._[name] = value;
  } else {
    if (value) {
      ctx._.setAttribute(name, value);
    } else {
      ctx._.removeAttribute(name);
    }
  }

  ctx.$p[name] = value;
}

function setAttrs(ctx, attrs) {
  if (!attrs) return;
  Object.keys(attrs).forEach(key => setAttr(ctx, key, attrs[key]));
  ctx.$p = attrs;
}

function renderChildren(ctx, pid, children, maybeIdx) {
  let parent = ctx[pid]._;
  let idx = maybeIdx || 0;
  let prevChildren = Array.from(parent.childNodes);

  if (!children || (!prevChildren.length && !children.length)) return;

  children.forEach(child => {
    if (child === null) {
      if (prevChildren[idx]) {
        parent.removeChild(prevChildren[idx]);
        idx++;
      }
      return;
    }
    if (isPrimitiveChild(child)) {
      if (prevChildren[idx]) {
        if (prevChildren[idx].nodeType === 3) {
          if (prevChildren[idx].textContent !== child) {
            prevChildren[idx].textContent = child;
          }
        } else {
          parent.replaceChild(
            document.createTextNode(child),
            prevChildren[idx]
          );
        }
        idx++;
        return;
      } else {
        idx++;
        return parent.appendChild(document.createTextNode(child));
      }
    } else if (Array.isArray(child)) {
      renderChildren({ $r: { _: parent } }, "$r", child, idx);
      idx += child.length;
      return;
    } else {
      let newChild = child.$r
        ? child.$r.$r
          ? child.$r.$r._
          : child.$r._
        : child._;
      if (prevChildren[idx]) {
        if (prevChildren[idx] !== newChild) {
          try {
            parent.replaceChild(newChild, prevChildren[idx]);
          } catch (e) {}
        }
        idx++;
        return;
      } else {
        if (prevChildren[idx]) {
          if (prevChildren[idx] !== newChild) {
            try {
              parent.replaceChild(newChild, prevChildren[idx]);
            } catch (e) {}
          }
          idx++;
          return;
        }
        parent.appendChild(newChild);
        idx++;
        return;
      }
    }
  });

  while (idx < prevChildren.length) {
    if (prevChildren[idx].parentNode) {
      try {
        prevChildren[idx].parentNode.removeChild(prevChildren[idx]);
      } catch (e) {}
    }
    idx++;
  }
}

function isPrimitiveChild(child) {
  return typeof child === "string" || typeof child === "number";
}

let gCtx = (() => {
  let $h = []; // Stack of hooks contexts
  return {
    // Set hooks context
    sHC: ctx => $h.push({ ctx, pos: 0 }),
    // Pop hooks context
    pHC: () => {
      let hc = $h.pop();
      hc.pos = 0;
    },
    // Get hooks context
    gHC: () => $h[$h.length - 1]
  };
})();

let [useState, useEffect] = (() => {
  let stateHooks = new Map();
  function useState(value) {
    let hc = gCtx.gHC();
    let hook = stateHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let val = hook[pos] === undefined ? value : hook[pos];

    hc.pos += 1;
    hook[pos] = val;
    stateHooks.set(hc.ctx, hook);

    return [
      val,
      newVal => {
        let hook = stateHooks.get(hc.ctx) || [];
        hook[pos] = newVal;
        stateHooks.set(hc.ctx, hook);
        if (hc.ctx.$) {
          hc.ctx.$(hc.ctx.$p);
        }
      }
    ];
  }

  let effectHooks = new Map();
  function useEffect(effect) {
    let hc = gCtx.gHC();
    let hook = effectHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let existingHook = hook[pos];
    if (existingHook) {
      existingHook();
    }
    let hookDestroy = effect();
    if (hookDestroy) {
      hook[pos] = hookDestroy;
      effectHooks.set(hc.ctx, hook);
    }
  }

  return [useState, useEffect];
})();

/* END RUNTIME */

const ALL_TODOS = "all";
const ACTIVE_TODOS = "active";
const COMPLETED_TODOS = "completed";

function uuid() {
  var i, random;
  var uuid = "";

  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;

    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += "-";
    }

    uuid += (i === 12 ? 4 : i === 16 ? random & 3 | 8 : random).toString(16);
  }

  return uuid;
}

function pluralize(count, word) {
  return count === 1 ? word : word + "s";
}

function useTodos() {
  let [todos, updateTodosList] = useState(JSON.parse(window.localStorage.getItem("__todos__") || "null") || [{
    id: uuid(),
    title: "todo 1",
    completed: false
  }, {
    id: uuid(),
    title: "todo 2",
    completed: false
  }, {
    id: uuid(),
    title: "todo 3",
    completed: true
  }]);
  return [todos, newTodos => {
    window.localStorage.setItem("__todos__", JSON.stringify(newTodos));
    updateTodosList(newTodos);
  }];
}

function TodoItem(props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: props,
    $: props => {
      TodoItem(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

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

  if (__ctx !== __pctx) {
    createElement(__ctx, "e1", "li", {
      className: className.join(" ")
    });
    createElement(__ctx, "e2", "div", {
      className: "view"
    });
    createElement(__ctx, "e3", "input", {
      className: "toggle",
      type: "checkbox",
      checked: props.todo.completed,
      onChange: props.onToggle
    });
    renderChildren(__ctx, "e3");
    createElement(__ctx, "e4", "label", {
      onDblclick: props.onEdit
    });
    renderChildren(__ctx, "e4", [props.todo.title]);
    createElement(__ctx, "e5", "button", {
      className: "destroy",
      onClick: props.onDestroy
    });
    renderChildren(__ctx, "e5");
    renderChildren(__ctx, "e2", [__ctx.e3, __ctx.e4, __ctx.e5]);
    createElement(__ctx, "e6", "input", {
      className: "edit",
      value: inputValue,
      onChange: e => setInputValue(e.target.value),
      onBlur: handleSubmit,
      onKeyDown: e => {
        if (e.which === 27) {
          props.onCancel(event);
          setInputValue(props.todo.title);
        } else if (event.which === 13) {
          handleSubmit();
        }
      }
    });
    renderChildren(__ctx, "e6");
    renderChildren(__ctx, "e1", [__ctx.e2, __ctx.e6]);
    __ctx.$r = __ctx.e1;

    __gctx.pHC();

    return __ctx;
  } else {
    let __e3__checked = props.todo.completed;
    __ctx.e3.$p.checked !== __e3__checked && setAttr(__ctx.e3, "checked", __e3__checked);
    let __e3__onChange = props.onToggle;
    __ctx.e3.$p.onChange !== __e3__onChange && setAttr(__ctx.e3, "onChange", __e3__onChange);
    let __e4__onDoubleClick = props.onEdit;
    __ctx.e4.$p.onDoubleClick !== __e4__onDoubleClick && setAttr(__ctx.e4, "onDoubleClick", __e4__onDoubleClick);
    renderChildren(__ctx, "e4", [props.todo.title]);
    let __e5__onClick = props.onDestroy;
    __ctx.e5.$p.onClick !== __e5__onClick && setAttr(__ctx.e5, "onClick", __e5__onClick);
    let __e6__value = inputValue;
    __ctx.e6.$p.value !== __e6__value && setAttr(__ctx.e6, "value", __e6__value);
    setAttr(__ctx.e6, "onChange", e => setInputValue(e.target.value));
    let __e6__onBlur = handleSubmit;
    __ctx.e6.$p.onBlur !== __e6__onBlur && setAttr(__ctx.e6, "onBlur", __e6__onBlur);
    setAttr(__ctx.e6, "onKeyDown", e => {
      if (e.which === 27) {
        props.onCancel(event);
        setInputValue(props.todo.title);
      } else if (event.which === 13) {
        handleSubmit();
      }
    });

    __gctx.pHC();
  }
}

function TodoFooter(props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: props,
    $: props => {
      TodoFooter(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  let activeTodoWord = pluralize(props.count, "item");
  let clearButton = null;

  if (__ctx !== __pctx) {
    createElement(__ctx, "e7", "button", {
      className: "clear-completed",
      onClick: props.onClearCompleted
    });
    renderChildren(__ctx, "e7", ["Clear completed"]);

    if (props.completedCount > 0) {
      clearButton = __ctx.e7;
    }

    createElement(__ctx, "e8", "footer", {
      className: "footer"
    });
    createElement(__ctx, "e9", "span", {
      className: "todo-count"
    });
    createElement(__ctx, "e10", "strong");
    renderChildren(__ctx, "e10", [props.count]);
    renderChildren(__ctx, "e9", [__ctx.e10, " ", activeTodoWord, " left"]);
    createElement(__ctx, "e11", "ul", {
      className: "filters"
    });
    createElement(__ctx, "e12", "li");
    createElement(__ctx, "e13", "a", {
      href: "#/",
      className: props.nowShowing === ALL_TODOS ? "selected" : ""
    });
    renderChildren(__ctx, "e13", ["All"]);
    renderChildren(__ctx, "e12", [__ctx.e13]);
    createElement(__ctx, "e14", "li");
    createElement(__ctx, "e15", "a", {
      href: "#/active",
      className: props.nowShowing === ACTIVE_TODOS ? "selected" : ""
    });
    renderChildren(__ctx, "e15", ["Active"]);
    renderChildren(__ctx, "e14", [__ctx.e15]);
    createElement(__ctx, "e16", "li");
    createElement(__ctx, "e17", "a", {
      href: "#/completed",
      className: props.nowShowing === COMPLETED_TODOS ? "selected" : ""
    });
    renderChildren(__ctx, "e17", ["Completed"]);
    renderChildren(__ctx, "e16", [__ctx.e17]);
    renderChildren(__ctx, "e11", [__ctx.e12, __ctx.e14, __ctx.e16]);
    renderChildren(__ctx, "e8", [__ctx.e9, __ctx.e11, clearButton]);
    __ctx.$r = __ctx.e8;

    __gctx.pHC();

    return __ctx;
  } else {
    let __e7__onClick = props.onClearCompleted;
    __ctx.e7.$p.onClick !== __e7__onClick && setAttr(__ctx.e7, "onClick", __e7__onClick);

    if (props.completedCount > 0) {
      clearButton = __ctx.e7;
    }

    renderChildren(__ctx, "e10", [props.count]);
    renderChildren(__ctx, "e9", [__ctx.e10, " ", activeTodoWord, " left"]);

    let __e13__className = props.nowShowing === ALL_TODOS ? "selected" : "";

    __ctx.e13.$p.className !== __e13__className && setAttr(__ctx.e13, "className", __e13__className);

    let __e15__className = props.nowShowing === ACTIVE_TODOS ? "selected" : "";

    __ctx.e15.$p.className !== __e15__className && setAttr(__ctx.e15, "className", __e15__className);

    let __e17__className = props.nowShowing === COMPLETED_TODOS ? "selected" : "";

    __ctx.e17.$p.className !== __e17__className && setAttr(__ctx.e17, "className", __e17__className);
    renderChildren(__ctx, "e8", [__ctx.e9, __ctx.e11, clearButton]);

    __gctx.pHC();
  }
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

function TodoApp(__props, __gctx, __pctx) {
  var __ctx = __pctx || {
    $p: __props,
    $: props => {
      TodoApp(props, __gctx, __ctx);
    }
  };

  __gctx.sHC(__ctx);

  let [inputValue, setInputValue] = useState("");
  let [nowShowing, setNowShowing] = useState(getNowShowingFromHash(window.location.hash));
  let [todos, updateTodosList] = useTodos();
  let [editing, setEditingState] = useState(null);
  useEffect(() => {
    let handler = () => {
      setNowShowing(getNowShowingFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  });
  let shownTodos = todos.filter(function (todo) {
    switch (nowShowing) {
      case ACTIVE_TODOS:
        return !todo.completed;

      case COMPLETED_TODOS:
        return todo.completed;

      default:
        return true;
    }
  }, this);
  let todoItems = shownTodos.map(function (todo, idx) {
    var __ctx = {};

    __gctx.sHC(__ctx);

    if (__ctx !== __pctx) {
      createComponent(__gctx, __ctx, "c1", TodoItem, {
        key: todo.id,
        todo: todo,
        editing: editing === todo.id,
        onEdit: () => setEditingState(todo.id),
        onSave: title => {
          todos.splice(idx, 1, { ...todo,
            title
          });
          updateTodosList(todos);
          setEditingState(null);
        },
        onCancel: () => setEditingState(null),
        onToggle: () => {
          todos.splice(idx, 1, { ...todo,
            completed: !todo.completed
          });
          updateTodosList(todos);
        },
        onDestroy: () => {
          todos.splice(idx, 1);
          updateTodosList(todos);
        }
      });
      __ctx.$r = __ctx.c1;

      __gctx.pHC();

      return __ctx;
    } else {
      __ctx.c1.$({
        key: todo.id,
        todo: todo,
        editing: editing === todo.id,
        onEdit: () => setEditingState(todo.id),
        onSave: title => {
          todos.splice(idx, 1, { ...todo,
            title
          });
          updateTodosList(todos);
          setEditingState(null);
        },
        onCancel: () => setEditingState(null),
        onToggle: () => {
          todos.splice(idx, 1, { ...todo,
            completed: !todo.completed
          });
          updateTodosList(todos);
        },
        onDestroy: () => {
          todos.splice(idx, 1);
          updateTodosList(todos);
        }
      });

      __gctx.pHC();
    }
  }, this);
  let activeTodoCount = todos.reduce(function (accum, todo) {
    return todo.completed ? accum : accum + 1;
  }, 0);
  let completedCount = todos.length - activeTodoCount;
  let main = null;
  let footer = null;

  if (__ctx !== __pctx) {
    createElement(__ctx, "e18", "section", {
      className: "main"
    });
    createElement(__ctx, "e19", "input", {
      id: "toggle-all",
      className: "toggle-all",
      type: "checkbox",
      checked: activeTodoCount === 0,
      onChange: () => {
        let completed = todos.every(t => t.completed);
        updateTodosList(todos.map(t => ({ ...t,
          completed: !completed
        })));
      }
    });
    renderChildren(__ctx, "e19");
    createElement(__ctx, "e20", "label", {
      for: "toggle-all"
    });
    renderChildren(__ctx, "e20");
    createElement(__ctx, "e21", "ul", {
      className: "todo-list"
    });
    renderChildren(__ctx, "e21", [todoItems]);
    renderChildren(__ctx, "e18", [__ctx.e19, __ctx.e20, __ctx.e21]);

    if (todos.length) {
      main = __ctx.e18;
    }

    createComponent(__gctx, __ctx, "c2", TodoFooter, {
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.c2;
    }

    createElement(__ctx, "e22", "div");
    createElement(__ctx, "e23", "header", {
      className: "header"
    });
    createElement(__ctx, "e24", "h1");
    renderChildren(__ctx, "e24", ["todos"]);
    createElement(__ctx, "e25", "input", {
      className: "new-todo",
      placeholder: "What needs to be done?",
      autoFocus: true,
      value: inputValue,
      onChange: e => setInputValue(e.target.value),
      onKeyDown: e => {
        if (e.keyCode !== 13 || !inputValue) return;
        e.preventDefault();
        todos.push({
          id: uuid(),
          title: inputValue,
          completed: false
        });
        updateTodosList(todos);
        setInputValue("");
      }
    });
    renderChildren(__ctx, "e25");
    renderChildren(__ctx, "e23", [__ctx.e24, __ctx.e25]);
    renderChildren(__ctx, "e22", [__ctx.e23, main, footer]);
    __ctx.$r = __ctx.e22;

    __gctx.pHC();

    return __ctx;
  } else {
    let __e19__checked = activeTodoCount === 0;

    __ctx.e19.$p.checked !== __e19__checked && setAttr(__ctx.e19, "checked", __e19__checked);
    setAttr(__ctx.e19, "onChange", () => {
      let completed = todos.every(t => t.completed);
      updateTodosList(todos.map(t => ({ ...t,
        completed: !completed
      })));
    });
    renderChildren(__ctx, "e21", [todoItems]);

    if (todos.length) {
      main = __ctx.e18;
    }

    __ctx.c2.$({
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.c2;
    }

    let __e25__value = inputValue;
    __ctx.e25.$p.value !== __e25__value && setAttr(__ctx.e25, "value", __e25__value);
    setAttr(__ctx.e25, "onChange", e => setInputValue(e.target.value));
    setAttr(__ctx.e25, "onKeyDown", e => {
      if (e.keyCode !== 13 || !inputValue) return;
      e.preventDefault();
      todos.push({
        id: uuid(),
        title: inputValue,
        completed: false
      });
      updateTodosList(todos);
      setInputValue("");
    });
    renderChildren(__ctx, "e22", [__ctx.e23, main, footer]);

    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, TodoApp, null);