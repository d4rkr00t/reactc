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

function toPx(val) {
  return typeof val === "number" ? val + "px" : val;
}

function appendChild(p, c) {
  p.appendChild(c);
}

function mount(parent, gctx, cmp, props) {
  let ctx = cmp(props, gctx);
  if (!ctx) return;
  parent.innerHTML = "";
  appendChild(parent, ctx.$r._);
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
  if (value) {
    ctx._.setAttribute(name, value);
  } else {
    ctx._.removeAttribute(name);
  }
  ctx.$p[name] = value;
}

function setProp(ctx, name, value) {
  ctx._[name] = value;
  ctx.$p[name] = value;
}
function setEvt(ctx, name, value) {
  if (ctx.$p[name]) {
    ctx._.removeEventListener(name, ctx.$p[name]);
  }
  ctx._.addEventListener(name, value);
  ctx.$p[name] = value;
}

function setAttrs(ctx, attrs) {
  if (!attrs) return;
  if (attrs.$)
    Object.keys(attrs.$).forEach(key => setAttr(ctx, key, attrs.$[key]));
  if (attrs.$e)
    Object.keys(attrs.$e).forEach(key => setEvt(ctx, key, attrs.$e[key]));
  if (attrs.$p)
    Object.keys(attrs.$p).forEach(key => setProp(ctx, key, attrs.$p[key]));
  ctx.$p = attrs;
}

function renderChildren(ctx, pid, children, maybeIdx) {
  let parent = ctx[pid]._;
  let idx = maybeIdx || 0;
  let prevChildren = Array.from(parent.childNodes);
  let isEmpty = !prevChildren.length;

  if (!children || (!prevChildren.length && !children.length)) return idx;

  let flatChildren = children.reduce((acc, i) => acc.concat(i), []);
  let nodesToKeep = new WeakSet();

  flatChildren.forEach(child => {
    if (child === null || child === undefined) {
      return;
    }

    let isPrimitive = isPrimitiveChild(child);
    let childElem = isPrimitive
      ? document.createTextNode(child)
      : child.$r
      ? child.$r.$r
        ? child.$r.$r._
        : child.$r._
      : child._;
    let childIdx = prevChildren.indexOf(childElem);
    let prevChild = prevChildren[idx];

    // input | c0 |
    //
    // 1     | c1 | c0 | 0
    // input | c0 |    | +1
    //
    // 1     | c1 | c1, c0 | +1
    // 2     | c2 |        | 0
    // input | c0 |        | +1

    if (childElem === null || childElem === undefined) {
      return;
    }

    if (isEmpty) {
      isEmpty = false;
      nodesToKeep.add(childElem);
      return appendChild(parent, childElem);
    } else if (childIdx === -1 && prevChild && !isPrimitive) {
      nodesToKeep.add(childElem);
      return parent.insertBefore(childElem, prevChild);
    } else if (isPrimitive && prevChild && prevChild.nodeType === 3) {
      prevChild.textContent = child;
      idx++;
      nodesToKeep.add(prevChild);
      return;
    } else if (prevChildren[childIdx] === childElem) {
      idx++;
      nodesToKeep.add(childElem);
      return;
    } else if (!prevChild) {
      nodesToKeep.add(childElem);
      return appendChild(parent, childElem);
    }
  });

  prevChildren.forEach(child => {
    if (!nodesToKeep.has(child)) {
      parent.removeChild(child);
    }
  });
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
    createElement(__ctx, "e61", "li", {
      $: {
        class: className.join(" ")
      }
    });
    createElement(__ctx, "e62", "div", {
      $: {
        class: "view"
      }
    });
    createElement(__ctx, "e63", "input", {
      $: {
        class: "toggle",
        type: "checkbox"
      },
      $e: {
        change: props.onToggle
      },
      $p: {
        checked: props.todo.completed
      }
    });
    renderChildren(__ctx, "e63");
    createElement(__ctx, "e64", "label", {
      $e: {
        dblclick: props.onEdit
      }
    });
    renderChildren(__ctx, "e64", [props.todo.title]);
    createElement(__ctx, "e65", "button", {
      $: {
        class: "destroy"
      },
      $e: {
        click: props.onDestroy
      }
    });
    renderChildren(__ctx, "e65");
    renderChildren(__ctx, "e62", [__ctx.e63, __ctx.e64, __ctx.e65]);
    createElement(__ctx, "e66", "input", {
      $: {
        class: "edit"
      },
      $e: {
        input: e => setInputValue(e.target.value),
        blur: handleSubmit,
        keydown: e => {
          if (e.which === 27) {
            props.onCancel(event);
            setInputValue(props.todo.title);
          } else if (event.which === 13) {
            handleSubmit();
          }
        }
      },
      $p: {
        value: inputValue
      }
    });
    renderChildren(__ctx, "e66");
    renderChildren(__ctx, "e61", [__ctx.e62, __ctx.e66]);
    __ctx.$r = __ctx.e61;

    __gctx.pHC();

    return __ctx;
  } else {
    let __e63__checked = props.todo.completed;
    __ctx.e63.$p.checked !== __e63__checked && setProp(__ctx.e63, "checked", __e63__checked);
    let __e63__change = props.onToggle;
    __ctx.e63.$p.change !== __e63__change && setEvt(__ctx.e63, "change", __e63__change);
    let __e64__dblclick = props.onEdit;
    __ctx.e64.$p.dblclick !== __e64__dblclick && setEvt(__ctx.e64, "dblclick", __e64__dblclick);
    renderChildren(__ctx, "e64", [props.todo.title]);
    let __e65__click = props.onDestroy;
    __ctx.e65.$p.click !== __e65__click && setEvt(__ctx.e65, "click", __e65__click);
    let __e66__value = inputValue;
    __ctx.e66.$p.value !== __e66__value && setProp(__ctx.e66, "value", __e66__value);
    setEvt(__ctx.e66, "input", e => setInputValue(e.target.value));
    let __e66__blur = handleSubmit;
    __ctx.e66.$p.blur !== __e66__blur && setEvt(__ctx.e66, "blur", __e66__blur);
    setEvt(__ctx.e66, "keydown", e => {
      if (e.which === 27) {
        props.onCancel(event);
        setInputValue(props.todo.title);
      } else if (event.which === 13) {
        handleSubmit();
      }
    });

    let __e61__class = className.join(" ");

    __ctx.e61.$p.class !== __e61__class && setAttr(__ctx.e61, "class", __e61__class);

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
    createElement(__ctx, "e67", "button", {
      $: {
        class: "clear-completed"
      },
      $e: {
        click: props.onClearCompleted
      }
    });
    renderChildren(__ctx, "e67", ["Clear completed"]);

    if (props.completedCount > 0) {
      clearButton = __ctx.e67;
    }

    createElement(__ctx, "e68", "footer", {
      $: {
        class: "footer"
      }
    });
    createElement(__ctx, "e69", "span", {
      $: {
        class: "todo-count"
      }
    });
    createElement(__ctx, "e70", "strong");
    renderChildren(__ctx, "e70", [props.count]);
    renderChildren(__ctx, "e69", [__ctx.e70, " ", activeTodoWord, " left"]);
    createElement(__ctx, "e71", "ul", {
      $: {
        class: "filters"
      }
    });
    createElement(__ctx, "e72", "li");
    createElement(__ctx, "e73", "a", {
      $: {
        href: "#/",
        class: props.nowShowing === ALL_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "e73", ["All"]);
    renderChildren(__ctx, "e72", [__ctx.e73]);
    createElement(__ctx, "e74", "li");
    createElement(__ctx, "e75", "a", {
      $: {
        href: "#/active",
        class: props.nowShowing === ACTIVE_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "e75", ["Active"]);
    renderChildren(__ctx, "e74", [__ctx.e75]);
    createElement(__ctx, "e76", "li");
    createElement(__ctx, "e77", "a", {
      $: {
        href: "#/completed",
        class: props.nowShowing === COMPLETED_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "e77", ["Completed"]);
    renderChildren(__ctx, "e76", [__ctx.e77]);
    renderChildren(__ctx, "e71", [__ctx.e72, __ctx.e74, __ctx.e76]);
    renderChildren(__ctx, "e68", [__ctx.e69, __ctx.e71, clearButton]);
    __ctx.$r = __ctx.e68;

    __gctx.pHC();

    return __ctx;
  } else {
    let __e67__click = props.onClearCompleted;
    __ctx.e67.$p.click !== __e67__click && setEvt(__ctx.e67, "click", __e67__click);

    if (props.completedCount > 0) {
      clearButton = __ctx.e67;
    }

    renderChildren(__ctx, "e70", [props.count]);
    renderChildren(__ctx, "e69", [__ctx.e70, " ", activeTodoWord, " left"]);

    let __e73__class = props.nowShowing === ALL_TODOS ? "selected" : "";

    __ctx.e73.$p.class !== __e73__class && setAttr(__ctx.e73, "class", __e73__class);

    let __e75__class = props.nowShowing === ACTIVE_TODOS ? "selected" : "";

    __ctx.e75.$p.class !== __e75__class && setAttr(__ctx.e75, "class", __e75__class);

    let __e77__class = props.nowShowing === COMPLETED_TODOS ? "selected" : "";

    __ctx.e77.$p.class !== __e77__class && setAttr(__ctx.e77, "class", __e77__class);
    renderChildren(__ctx, "e68", [__ctx.e69, __ctx.e71, clearButton]);

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
      createComponent(__gctx, __ctx, "c7", TodoItem, {
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
      __ctx.$r = __ctx.c7;

      __gctx.pHC();

      return __ctx;
    } else {
      __ctx.c7.$({
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
    createElement(__ctx, "e78", "section", {
      $: {
        class: "main"
      }
    });
    createElement(__ctx, "e79", "input", {
      $: {
        id: "toggle-all",
        class: "toggle-all",
        type: "checkbox"
      },
      $e: {
        change: () => {
          let completed = todos.every(t => t.completed);
          updateTodosList(todos.map(t => ({ ...t,
            completed: !completed
          })));
        }
      },
      $p: {
        checked: activeTodoCount === 0
      }
    });
    renderChildren(__ctx, "e79");
    createElement(__ctx, "e80", "label", {
      $: {
        for: "toggle-all"
      }
    });
    renderChildren(__ctx, "e80");
    createElement(__ctx, "e81", "ul", {
      $: {
        class: "todo-list"
      }
    });
    renderChildren(__ctx, "e81", [todoItems]);
    renderChildren(__ctx, "e78", [__ctx.e79, __ctx.e80, __ctx.e81]);

    if (todos.length) {
      main = __ctx.e78;
    }

    createComponent(__gctx, __ctx, "c8", TodoFooter, {
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.c8;
    }

    createElement(__ctx, "e82", "div");
    createElement(__ctx, "e83", "header", {
      $: {
        class: "header"
      }
    });
    createElement(__ctx, "e84", "h1");
    renderChildren(__ctx, "e84", ["todos"]);
    createElement(__ctx, "e85", "input", {
      $: {
        class: "new-todo",
        placeholder: "What needs to be done?",
        autoFocus: true
      },
      $e: {
        input: e => setInputValue(e.target.value),
        keydown: e => {
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
      },
      $p: {
        value: inputValue
      }
    });
    renderChildren(__ctx, "e85");
    renderChildren(__ctx, "e83", [__ctx.e84, __ctx.e85]);
    renderChildren(__ctx, "e82", [__ctx.e83, main, footer]);
    __ctx.$r = __ctx.e82;

    __gctx.pHC();

    return __ctx;
  } else {
    let __e79__checked = activeTodoCount === 0;

    __ctx.e79.$p.checked !== __e79__checked && setProp(__ctx.e79, "checked", __e79__checked);
    setEvt(__ctx.e79, "change", () => {
      let completed = todos.every(t => t.completed);
      updateTodosList(todos.map(t => ({ ...t,
        completed: !completed
      })));
    });
    renderChildren(__ctx, "e81", [todoItems]);

    if (todos.length) {
      main = __ctx.e78;
    }

    __ctx.c8.$({
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.c8;
    }

    let __e85__value = inputValue;
    __ctx.e85.$p.value !== __e85__value && setProp(__ctx.e85, "value", __e85__value);
    setEvt(__ctx.e85, "input", e => setInputValue(e.target.value));
    setEvt(__ctx.e85, "keydown", e => {
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
    renderChildren(__ctx, "e82", [__ctx.e83, main, footer]);

    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, TodoApp, null);