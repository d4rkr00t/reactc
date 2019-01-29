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
    createElement(__ctx, "bp", "li", {
      $: {
        class: className.join(" ")
      }
    });
    createElement(__ctx, "bq", "div", {
      $: {
        class: "view"
      }
    });
    createElement(__ctx, "br", "input", {
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
    renderChildren(__ctx, "br");
    createElement(__ctx, "bs", "label", {
      $e: {
        dblclick: props.onEdit
      }
    });
    renderChildren(__ctx, "bs", [props.todo.title]);
    createElement(__ctx, "bt", "button", {
      $: {
        class: "destroy"
      },
      $e: {
        click: props.onDestroy
      }
    });
    renderChildren(__ctx, "bt");
    renderChildren(__ctx, "bq", [__ctx.br, __ctx.bs, __ctx.bt]);
    createElement(__ctx, "bu", "input", {
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
    renderChildren(__ctx, "bu");
    renderChildren(__ctx, "bp", [__ctx.bq, __ctx.bu]);
    __ctx.$r = __ctx.bp;

    __gctx.pHC();

    return __ctx;
  } else {
    let __br__checked = props.todo.completed;
    __ctx.br.$p.checked !== __br__checked && setProp(__ctx.br, "checked", __br__checked);
    let __br__change = props.onToggle;
    __ctx.br.$p.change !== __br__change && setEvt(__ctx.br, "change", __br__change);
    let __bs__dblclick = props.onEdit;
    __ctx.bs.$p.dblclick !== __bs__dblclick && setEvt(__ctx.bs, "dblclick", __bs__dblclick);
    renderChildren(__ctx, "bs", [props.todo.title]);
    let __bt__click = props.onDestroy;
    __ctx.bt.$p.click !== __bt__click && setEvt(__ctx.bt, "click", __bt__click);
    let __bu__value = inputValue;
    __ctx.bu.$p.value !== __bu__value && setProp(__ctx.bu, "value", __bu__value);
    setEvt(__ctx.bu, "input", e => setInputValue(e.target.value));
    let __bu__blur = handleSubmit;
    __ctx.bu.$p.blur !== __bu__blur && setEvt(__ctx.bu, "blur", __bu__blur);
    setEvt(__ctx.bu, "keydown", e => {
      if (e.which === 27) {
        props.onCancel(event);
        setInputValue(props.todo.title);
      } else if (event.which === 13) {
        handleSubmit();
      }
    });

    let __bp__class = className.join(" ");

    __ctx.bp.$p.class !== __bp__class && setAttr(__ctx.bp, "class", __bp__class);

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
    createElement(__ctx, "bv", "button", {
      $: {
        class: "clear-completed"
      },
      $e: {
        click: props.onClearCompleted
      }
    });
    renderChildren(__ctx, "bv", ["Clear completed"]);

    if (props.completedCount > 0) {
      clearButton = __ctx.bv;
    }

    createElement(__ctx, "bw", "footer", {
      $: {
        class: "footer"
      }
    });
    createElement(__ctx, "bx", "span", {
      $: {
        class: "todo-count"
      }
    });
    createElement(__ctx, "by", "strong");
    renderChildren(__ctx, "by", [props.count]);
    renderChildren(__ctx, "bx", [__ctx.by, " ", activeTodoWord, " left"]);
    createElement(__ctx, "bz", "ul", {
      $: {
        class: "filters"
      }
    });
    createElement(__ctx, "ca", "li");
    createElement(__ctx, "cb", "a", {
      $: {
        href: "#/",
        class: props.nowShowing === ALL_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "cb", ["All"]);
    renderChildren(__ctx, "ca", [__ctx.cb]);
    createElement(__ctx, "cc", "li");
    createElement(__ctx, "cd", "a", {
      $: {
        href: "#/active",
        class: props.nowShowing === ACTIVE_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "cd", ["Active"]);
    renderChildren(__ctx, "cc", [__ctx.cd]);
    createElement(__ctx, "ce", "li");
    createElement(__ctx, "cf", "a", {
      $: {
        href: "#/completed",
        class: props.nowShowing === COMPLETED_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "cf", ["Completed"]);
    renderChildren(__ctx, "ce", [__ctx.cf]);
    renderChildren(__ctx, "bz", [__ctx.ca, __ctx.cc, __ctx.ce]);
    renderChildren(__ctx, "bw", [__ctx.bx, __ctx.bz, clearButton]);
    __ctx.$r = __ctx.bw;

    __gctx.pHC();

    return __ctx;
  } else {
    let __bv__click = props.onClearCompleted;
    __ctx.bv.$p.click !== __bv__click && setEvt(__ctx.bv, "click", __bv__click);

    if (props.completedCount > 0) {
      clearButton = __ctx.bv;
    }

    renderChildren(__ctx, "by", [props.count]);
    renderChildren(__ctx, "bx", [__ctx.by, " ", activeTodoWord, " left"]);

    let __cb__class = props.nowShowing === ALL_TODOS ? "selected" : "";

    __ctx.cb.$p.class !== __cb__class && setAttr(__ctx.cb, "class", __cb__class);

    let __cd__class = props.nowShowing === ACTIVE_TODOS ? "selected" : "";

    __ctx.cd.$p.class !== __cd__class && setAttr(__ctx.cd, "class", __cd__class);

    let __cf__class = props.nowShowing === COMPLETED_TODOS ? "selected" : "";

    __ctx.cf.$p.class !== __cf__class && setAttr(__ctx.cf, "class", __cf__class);
    renderChildren(__ctx, "bw", [__ctx.bx, __ctx.bz, clearButton]);

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
      createComponent(__gctx, __ctx, "cg", TodoItem, {
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
      __ctx.$r = __ctx.cg;

      __gctx.pHC();

      return __ctx;
    } else {
      __ctx.cg.$({
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
    createElement(__ctx, "ch", "section", {
      $: {
        class: "main"
      }
    });
    createElement(__ctx, "ci", "input", {
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
    renderChildren(__ctx, "ci");
    createElement(__ctx, "cj", "label", {
      $: {
        for: "toggle-all"
      }
    });
    renderChildren(__ctx, "cj");
    createElement(__ctx, "ck", "ul", {
      $: {
        class: "todo-list"
      }
    });
    renderChildren(__ctx, "ck", [todoItems]);
    renderChildren(__ctx, "ch", [__ctx.ci, __ctx.cj, __ctx.ck]);

    if (todos.length) {
      main = __ctx.ch;
    }

    createComponent(__gctx, __ctx, "cl", TodoFooter, {
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.cl;
    }

    createElement(__ctx, "cm", "div");
    createElement(__ctx, "cn", "header", {
      $: {
        class: "header"
      }
    });
    createElement(__ctx, "co", "h1");
    renderChildren(__ctx, "co", ["todos"]);
    createElement(__ctx, "cp", "input", {
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
    renderChildren(__ctx, "cp");
    renderChildren(__ctx, "cn", [__ctx.co, __ctx.cp]);
    renderChildren(__ctx, "cm", [__ctx.cn, main, footer]);
    __ctx.$r = __ctx.cm;

    __gctx.pHC();

    return __ctx;
  } else {
    let __ci__checked = activeTodoCount === 0;

    __ctx.ci.$p.checked !== __ci__checked && setProp(__ctx.ci, "checked", __ci__checked);
    setEvt(__ctx.ci, "change", () => {
      let completed = todos.every(t => t.completed);
      updateTodosList(todos.map(t => ({ ...t,
        completed: !completed
      })));
    });
    renderChildren(__ctx, "ck", [todoItems]);

    if (todos.length) {
      main = __ctx.ch;
    }

    __ctx.cl.$({
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.cl;
    }

    let __cp__value = inputValue;
    __ctx.cp.$p.value !== __cp__value && setProp(__ctx.cp, "value", __cp__value);
    setEvt(__ctx.cp, "input", e => setInputValue(e.target.value));
    setEvt(__ctx.cp, "keydown", e => {
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
    renderChildren(__ctx, "cm", [__ctx.cn, main, footer]);

    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, TodoApp, null);