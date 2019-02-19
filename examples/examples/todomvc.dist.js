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
    createElement(__ctx, "bt", "li", {
      $: {
        class: className.join(" ")
      }
    });
    createElement(__ctx, "bu", "div", {
      $: {
        class: "view"
      }
    });
    createElement(__ctx, "bv", "input", {
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
    renderChildren(__ctx, "bv");
    createElement(__ctx, "bw", "label", {
      $e: {
        dblclick: props.onEdit
      }
    });
    renderChildren(__ctx, "bw", [props.todo.title]);
    createElement(__ctx, "bx", "button", {
      $: {
        class: "destroy"
      },
      $e: {
        click: props.onDestroy
      }
    });
    renderChildren(__ctx, "bx");
    renderChildren(__ctx, "bu", [__ctx.bv, __ctx.bw, __ctx.bx]);
    createElement(__ctx, "by", "input", {
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
    renderChildren(__ctx, "by");
    renderChildren(__ctx, "bt", [__ctx.bu, __ctx.by]);
    __ctx.$r = __ctx.bt;

    __gctx.pHC();

    return __ctx;
  } else {
    let __bv__checked = props.todo.completed;
    __ctx.bv.$p.checked !== __bv__checked && setProp(__ctx.bv, "checked", __bv__checked);
    let __bv__change = props.onToggle;
    __ctx.bv.$p.change !== __bv__change && setEvt(__ctx.bv, "change", __bv__change);
    let __bw__dblclick = props.onEdit;
    __ctx.bw.$p.dblclick !== __bw__dblclick && setEvt(__ctx.bw, "dblclick", __bw__dblclick);
    renderChildren(__ctx, "bw", [props.todo.title]);
    let __bx__click = props.onDestroy;
    __ctx.bx.$p.click !== __bx__click && setEvt(__ctx.bx, "click", __bx__click);
    let __by__value = inputValue;
    __ctx.by.$p.value !== __by__value && setProp(__ctx.by, "value", __by__value);
    setEvt(__ctx.by, "input", e => setInputValue(e.target.value));
    let __by__blur = handleSubmit;
    __ctx.by.$p.blur !== __by__blur && setEvt(__ctx.by, "blur", __by__blur);
    setEvt(__ctx.by, "keydown", e => {
      if (e.which === 27) {
        props.onCancel(event);
        setInputValue(props.todo.title);
      } else if (event.which === 13) {
        handleSubmit();
      }
    });

    let __bt__class = className.join(" ");

    __ctx.bt.$p.class !== __bt__class && setAttr(__ctx.bt, "class", __bt__class);

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
    createElement(__ctx, "bz", "button", {
      $: {
        class: "clear-completed"
      },
      $e: {
        click: props.onClearCompleted
      }
    });
    renderChildren(__ctx, "bz", ["Clear completed"]);

    if (props.completedCount > 0) {
      clearButton = __ctx.bz;
    }

    createElement(__ctx, "ca", "footer", {
      $: {
        class: "footer"
      }
    });
    createElement(__ctx, "cb", "span", {
      $: {
        class: "todo-count"
      }
    });
    createElement(__ctx, "cc", "strong");
    renderChildren(__ctx, "cc", [props.count]);
    renderChildren(__ctx, "cb", [__ctx.cc, " ", activeTodoWord, " left"]);
    createElement(__ctx, "cd", "ul", {
      $: {
        class: "filters"
      }
    });
    createElement(__ctx, "ce", "li");
    createElement(__ctx, "cf", "a", {
      $: {
        href: "#/",
        class: props.nowShowing === ALL_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "cf", ["All"]);
    renderChildren(__ctx, "ce", [__ctx.cf]);
    createElement(__ctx, "cg", "li");
    createElement(__ctx, "ch", "a", {
      $: {
        href: "#/active",
        class: props.nowShowing === ACTIVE_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "ch", ["Active"]);
    renderChildren(__ctx, "cg", [__ctx.ch]);
    createElement(__ctx, "ci", "li");
    createElement(__ctx, "cj", "a", {
      $: {
        href: "#/completed",
        class: props.nowShowing === COMPLETED_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "cj", ["Completed"]);
    renderChildren(__ctx, "ci", [__ctx.cj]);
    renderChildren(__ctx, "cd", [__ctx.ce, __ctx.cg, __ctx.ci]);
    renderChildren(__ctx, "ca", [__ctx.cb, __ctx.cd, clearButton]);
    __ctx.$r = __ctx.ca;

    __gctx.pHC();

    return __ctx;
  } else {
    let __bz__click = props.onClearCompleted;
    __ctx.bz.$p.click !== __bz__click && setEvt(__ctx.bz, "click", __bz__click);

    if (props.completedCount > 0) {
      clearButton = __ctx.bz;
    }

    renderChildren(__ctx, "cc", [props.count]);
    renderChildren(__ctx, "cb", [__ctx.cc, " ", activeTodoWord, " left"]);

    let __cf__class = props.nowShowing === ALL_TODOS ? "selected" : "";

    __ctx.cf.$p.class !== __cf__class && setAttr(__ctx.cf, "class", __cf__class);

    let __ch__class = props.nowShowing === ACTIVE_TODOS ? "selected" : "";

    __ctx.ch.$p.class !== __ch__class && setAttr(__ctx.ch, "class", __ch__class);

    let __cj__class = props.nowShowing === COMPLETED_TODOS ? "selected" : "";

    __ctx.cj.$p.class !== __cj__class && setAttr(__ctx.cj, "class", __cj__class);
    renderChildren(__ctx, "ca", [__ctx.cb, __ctx.cd, clearButton]);

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
      createComponent(__gctx, __ctx, "ck", TodoItem, {
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
      __ctx.$r = __ctx.ck;

      __gctx.pHC();

      return __ctx;
    } else {
      __ctx.ck.$({
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
    createElement(__ctx, "cl", "section", {
      $: {
        class: "main"
      }
    });
    createElement(__ctx, "cm", "input", {
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
    renderChildren(__ctx, "cm");
    createElement(__ctx, "cn", "label", {
      $: {
        for: "toggle-all"
      }
    });
    renderChildren(__ctx, "cn");
    createElement(__ctx, "co", "ul", {
      $: {
        class: "todo-list"
      }
    });
    renderChildren(__ctx, "co", [todoItems]);
    renderChildren(__ctx, "cl", [__ctx.cm, __ctx.cn, __ctx.co]);

    if (todos.length) {
      main = __ctx.cl;
    }

    createComponent(__gctx, __ctx, "cp", TodoFooter, {
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.cp;
    }

    createElement(__ctx, "cq", "div");
    createElement(__ctx, "cr", "header", {
      $: {
        class: "header"
      }
    });
    createElement(__ctx, "cs", "h1");
    renderChildren(__ctx, "cs", ["todos"]);
    createElement(__ctx, "ct", "input", {
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
    renderChildren(__ctx, "ct");
    renderChildren(__ctx, "cr", [__ctx.cs, __ctx.ct]);
    renderChildren(__ctx, "cq", [__ctx.cr, main, footer]);
    __ctx.$r = __ctx.cq;

    __gctx.pHC();

    return __ctx;
  } else {
    let __cm__checked = activeTodoCount === 0;

    __ctx.cm.$p.checked !== __cm__checked && setProp(__ctx.cm, "checked", __cm__checked);
    setEvt(__ctx.cm, "change", () => {
      let completed = todos.every(t => t.completed);
      updateTodosList(todos.map(t => ({ ...t,
        completed: !completed
      })));
    });
    renderChildren(__ctx, "co", [todoItems]);

    if (todos.length) {
      main = __ctx.cl;
    }

    __ctx.cp.$({
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.cp;
    }

    let __ct__value = inputValue;
    __ctx.ct.$p.value !== __ct__value && setProp(__ctx.ct, "value", __ct__value);
    setEvt(__ctx.ct, "input", e => setInputValue(e.target.value));
    setEvt(__ctx.ct, "keydown", e => {
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
    renderChildren(__ctx, "cq", [__ctx.cr, main, footer]);

    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, TodoApp, null);