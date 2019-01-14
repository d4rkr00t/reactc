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
    ctx._.setAttribute(
      name,
      Object.keys(value)
        .map(prop => {
          let val = value[prop];
          return (
            prop.replace(/([A-Z])/g, $1 => "-" + $1.toLowerCase()) +
            ": " +
            (typeof val === "number" ? val + "px" : val)
          );
        })
        .join(";")
    );
  } else if (name.startsWith("on")) {
    let eventName = name.replace("on", "").toLowerCase();
    if (
      eventName === "change" &&
      ctx._.nodeName === "INPUT" &&
      ctx._.type === "text"
    ) {
      eventName = "input";
    }

    if (eventName === "doubleclick") {
      eventName = "dblclick";
    }

    if (ctx.$p[name]) {
      ctx._.removeEventListener(eventName, ctx.$p[name]);
    }
    ctx._.addEventListener(eventName, value);
  } else if (name === "value") {
    ctx._.value = value;
  } else if (name.match(/html[A-Z]/)) {
    let attrName = name.replace("html", "").toLowerCase();
    ctx._.setAttribute(attrName, value);
  } else if (name === "checked") {
    if (value === false) {
      ctx._.checked = false;
    } else {
      ctx._.checked = true;
    }
  } else {
    ctx._.setAttribute(name, value);
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

  if (!prevChildren.length && !children.length) return;

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
    createElement(__ctx, "e53", "li", {
      class: className.join(" ")
    });
    createElement(__ctx, "e54", "div", {
      class: "view"
    });
    createElement(__ctx, "e55", "input", {
      class: "toggle",
      type: "checkbox",
      checked: props.todo.completed,
      onChange: props.onToggle
    });
    renderChildren(__ctx, "e55", []);
    createElement(__ctx, "e56", "label", {
      onDoubleClick: props.onEdit
    });
    renderChildren(__ctx, "e56", [props.todo.title]);
    createElement(__ctx, "e57", "button", {
      class: "destroy",
      onClick: props.onDestroy
    });
    renderChildren(__ctx, "e57", []);
    renderChildren(__ctx, "e54", [__ctx.e55, __ctx.e56, __ctx.e57]);
    createElement(__ctx, "e58", "input", {
      class: "edit",
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
    renderChildren(__ctx, "e58", []);
    renderChildren(__ctx, "e53", [__ctx.e54, __ctx.e58]);
    __ctx.$r = __ctx.e53;

    __gctx.pHC();

    return __ctx;
  } else {
    let __e55__checked = props.todo.completed;
    __ctx.e55.$p.checked !== __e55__checked && setAttr(__ctx.e55, "checked", __e55__checked);
    let __e55__onChange = props.onToggle;
    __ctx.e55.$p.onChange !== __e55__onChange && setAttr(__ctx.e55, "onChange", __e55__onChange);
    let __e56__onDoubleClick = props.onEdit;
    __ctx.e56.$p.onDoubleClick !== __e56__onDoubleClick && setAttr(__ctx.e56, "onDoubleClick", __e56__onDoubleClick);
    renderChildren(__ctx, "e56", [props.todo.title]);
    let __e57__onClick = props.onDestroy;
    __ctx.e57.$p.onClick !== __e57__onClick && setAttr(__ctx.e57, "onClick", __e57__onClick);
    let __e58__value = inputValue;
    __ctx.e58.$p.value !== __e58__value && setAttr(__ctx.e58, "value", __e58__value);

    let __e58__onChange = e => setInputValue(e.target.value);

    __ctx.e58.$p.onChange !== __e58__onChange && setAttr(__ctx.e58, "onChange", __e58__onChange);
    let __e58__onBlur = handleSubmit;
    __ctx.e58.$p.onBlur !== __e58__onBlur && setAttr(__ctx.e58, "onBlur", __e58__onBlur);

    let __e58__onKeyDown = e => {
      if (e.which === 27) {
        props.onCancel(event);
        setInputValue(props.todo.title);
      } else if (event.which === 13) {
        handleSubmit();
      }
    };

    __ctx.e58.$p.onKeyDown !== __e58__onKeyDown && setAttr(__ctx.e58, "onKeyDown", __e58__onKeyDown);

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
    createElement(__ctx, "e59", "button", {
      class: "clear-completed",
      onClick: props.onClearCompleted
    });
    renderChildren(__ctx, "e59", ["Clear completed"]);

    if (props.completedCount > 0) {
      clearButton = __ctx.e59;
    }

    createElement(__ctx, "e60", "footer", {
      class: "footer"
    });
    createElement(__ctx, "e61", "span", {
      class: "todo-count"
    });
    createElement(__ctx, "e62", "strong");
    renderChildren(__ctx, "e62", [props.count]);
    renderChildren(__ctx, "e61", [__ctx.e62, " ", activeTodoWord, " left"]);
    createElement(__ctx, "e63", "ul", {
      class: "filters"
    });
    createElement(__ctx, "e64", "li");
    createElement(__ctx, "e65", "a", {
      href: "#/",
      class: props.nowShowing === ALL_TODOS ? "selected" : ""
    });
    renderChildren(__ctx, "e65", ["All"]);
    renderChildren(__ctx, "e64", [__ctx.e65]);
    createElement(__ctx, "e66", "li");
    createElement(__ctx, "e67", "a", {
      href: "#/active",
      class: props.nowShowing === ACTIVE_TODOS ? "selected" : ""
    });
    renderChildren(__ctx, "e67", ["Active"]);
    renderChildren(__ctx, "e66", [__ctx.e67]);
    createElement(__ctx, "e68", "li");
    createElement(__ctx, "e69", "a", {
      href: "#/completed",
      class: props.nowShowing === COMPLETED_TODOS ? "selected" : ""
    });
    renderChildren(__ctx, "e69", ["Completed"]);
    renderChildren(__ctx, "e68", [__ctx.e69]);
    renderChildren(__ctx, "e63", [__ctx.e64, __ctx.e66, __ctx.e68]);
    renderChildren(__ctx, "e60", [__ctx.e61, __ctx.e63, clearButton]);
    __ctx.$r = __ctx.e60;

    __gctx.pHC();

    return __ctx;
  } else {
    let __e59__onClick = props.onClearCompleted;
    __ctx.e59.$p.onClick !== __e59__onClick && setAttr(__ctx.e59, "onClick", __e59__onClick);

    if (props.completedCount > 0) {
      clearButton = __ctx.e59;
    }

    renderChildren(__ctx, "e62", [props.count]);
    renderChildren(__ctx, "e61", [__ctx.e62, " ", activeTodoWord, " left"]);

    let __e65__class = props.nowShowing === ALL_TODOS ? "selected" : "";

    __ctx.e65.$p.class !== __e65__class && setAttr(__ctx.e65, "class", __e65__class);

    let __e67__class = props.nowShowing === ACTIVE_TODOS ? "selected" : "";

    __ctx.e67.$p.class !== __e67__class && setAttr(__ctx.e67, "class", __e67__class);

    let __e69__class = props.nowShowing === COMPLETED_TODOS ? "selected" : "";

    __ctx.e69.$p.class !== __e69__class && setAttr(__ctx.e69, "class", __e69__class);
    renderChildren(__ctx, "e60", [__ctx.e61, __ctx.e63, clearButton]);

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
      createComponent(__gctx, __ctx, "c6", TodoItem, {
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
      __ctx.$r = __ctx.c6;

      __gctx.pHC();

      return __ctx;
    } else {
      __ctx.c6.$({
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
    createElement(__ctx, "e70", "section", {
      class: "main"
    });
    createElement(__ctx, "e71", "input", {
      id: "toggle-all",
      class: "toggle-all",
      type: "checkbox",
      checked: activeTodoCount === 0,
      onChange: () => {
        let completed = todos.every(t => t.completed);
        updateTodosList(todos.map(t => ({ ...t,
          completed: !completed
        })));
      }
    });
    renderChildren(__ctx, "e71", []);
    createElement(__ctx, "e72", "label", {
      htmlFor: "toggle-all"
    });
    renderChildren(__ctx, "e72", []);
    createElement(__ctx, "e73", "ul", {
      class: "todo-list"
    });
    renderChildren(__ctx, "e73", [todoItems]);
    renderChildren(__ctx, "e70", [__ctx.e71, __ctx.e72, __ctx.e73]);

    if (todos.length) {
      main = __ctx.e70;
    }

    createComponent(__gctx, __ctx, "c7", TodoFooter, {
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.c7;
    }

    createElement(__ctx, "e74", "div");
    createElement(__ctx, "e75", "header", {
      class: "header"
    });
    createElement(__ctx, "e76", "h1");
    renderChildren(__ctx, "e76", ["todos"]);
    createElement(__ctx, "e77", "input", {
      class: "new-todo",
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
    renderChildren(__ctx, "e77", []);
    renderChildren(__ctx, "e75", [__ctx.e76, __ctx.e77]);
    renderChildren(__ctx, "e74", [__ctx.e75, main, footer]);
    __ctx.$r = __ctx.e74;

    __gctx.pHC();

    return __ctx;
  } else {
    let __e71__checked = activeTodoCount === 0;

    __ctx.e71.$p.checked !== __e71__checked && setAttr(__ctx.e71, "checked", __e71__checked);

    let __e71__onChange = () => {
      let completed = todos.every(t => t.completed);
      updateTodosList(todos.map(t => ({ ...t,
        completed: !completed
      })));
    };

    __ctx.e71.$p.onChange !== __e71__onChange && setAttr(__ctx.e71, "onChange", __e71__onChange);
    renderChildren(__ctx, "e73", [todoItems]);

    if (todos.length) {
      main = __ctx.e70;
    }

    __ctx.c7.$({
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.c7;
    }

    let __e77__value = inputValue;
    __ctx.e77.$p.value !== __e77__value && setAttr(__ctx.e77, "value", __e77__value);

    let __e77__onChange = e => setInputValue(e.target.value);

    __ctx.e77.$p.onChange !== __e77__onChange && setAttr(__ctx.e77, "onChange", __e77__onChange);

    let __e77__onKeyDown = e => {
      if (e.keyCode !== 13 || !inputValue) return;
      e.preventDefault();
      todos.push({
        id: uuid(),
        title: inputValue,
        completed: false
      });
      updateTodosList(todos);
      setInputValue("");
    };

    __ctx.e77.$p.onKeyDown !== __e77__onKeyDown && setAttr(__ctx.e77, "onKeyDown", __e77__onKeyDown);
    renderChildren(__ctx, "e74", [__ctx.e75, main, footer]);

    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, TodoApp, null);