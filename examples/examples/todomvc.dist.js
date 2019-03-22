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

function setRef(ctx, name, value) {
  value.current = ctx[name]._;
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
    sHC: ctx => $h.push({ ctx, pos: 0, effects: [] }),
    // Pop hooks context
    pHC: () => {
      let hc = $h.pop();
      hc.pos = 0;
      hc.effects.forEach(eff => eff());
      hc.effects = [];
    },
    // Get hooks context
    gHC: () => $h[$h.length - 1]
  };
})();

let compareArrays = (arr1 = [], arr2 = []) => {
  if (arr1.length !== arr2.length) return false;
  if (!arr1.length && !arr2.length) return true;
  return arr1.every((item, idx) => item === arr2[idx]);
};

let [useState, useEffect, useRef] = (() => {
  let stateHooks = new Map();
  function useState(value) {
    let hc = gCtx.gHC();
    let hook = stateHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let val =
      hook[pos] === undefined
        ? typeof value === "function"
          ? value()
          : value
        : hook[pos];

    hc.pos += 1;
    hook[pos] = val;
    stateHooks.set(hc.ctx, hook);

    return [
      val,
      newVal => {
        let hook = stateHooks.get(hc.ctx) || [];
        hook[pos] = typeof newVal === "function" ? newVal(hook[pos]) : newVal;
        stateHooks.set(hc.ctx, hook);
        if (hc.ctx.$) {
          hc.ctx.$(hc.ctx.$p);
        }
      }
    ];
  }

  let effectHooks = new Map();
  function useEffect(effect, cache) {
    let hc = gCtx.gHC();
    let hook = effectHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let existingHook = hook[pos];
    hc.pos += 1;
    if (
      (existingHook && compareArrays(existingHook.cache, cache)) ||
      (existingHook && Array.isArray(cache) && !cache.length)
    ) {
      return;
    }

    hook[pos] = { cache };
    effectHooks.set(hc.ctx, hook);

    hc.effects.push(() => {
      if (existingHook && existingHook.hookDestroy) {
        existingHook.hookDestroy();
      }
      let hookDestroy = effect();
      let hook = effectHooks.get(hc.ctx) || [];
      hook[pos] = { hookDestroy, cache };
      effectHooks.set(hc.ctx, hook);
    });
  }

  let refHooks = new Map();
  function useRef(initialValue) {
    let hc = gCtx.gHC();
    let hook = refHooks.get(hc.ctx) || [];
    let pos = hc.pos;
    let existingRef = hook[pos];
    hc.pos += 1;
    if (existingRef) {
      return existingRef;
    }
    hook[pos] = { current: initialValue };
    refHooks.set(hc.ctx, hook);
    return hook[pos];
  }

  return [useState, useEffect, useRef];
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
    createElement(__ctx, "bw", "li", {
      $: {
        class: className.join(" ")
      }
    });
    createElement(__ctx, "bx", "div", {
      $: {
        class: "view"
      }
    });
    createElement(__ctx, "by", "input", {
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
    renderChildren(__ctx, "by");
    createElement(__ctx, "bz", "label", {
      $e: {
        dblclick: props.onEdit
      }
    });
    renderChildren(__ctx, "bz", [props.todo.title]);
    createElement(__ctx, "ca", "button", {
      $: {
        class: "destroy"
      },
      $e: {
        click: props.onDestroy
      }
    });
    renderChildren(__ctx, "ca");
    renderChildren(__ctx, "bx", [__ctx.by, __ctx.bz, __ctx.ca]);
    createElement(__ctx, "cb", "input", {
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
    renderChildren(__ctx, "cb");
    renderChildren(__ctx, "bw", [__ctx.bx, __ctx.cb]);
    __ctx.$r = __ctx.bw;

    __gctx.pHC();

    return __ctx;
  } else {
    let __by__checked = props.todo.completed;
    __ctx.by.$p.checked !== __by__checked && setProp(__ctx.by, "checked", __by__checked);
    let __by__change = props.onToggle;
    __ctx.by.$p.change !== __by__change && setEvt(__ctx.by, "change", __by__change);
    renderChildren(__ctx, "bz", [props.todo.title]);
    let __bz__dblclick = props.onEdit;
    __ctx.bz.$p.dblclick !== __bz__dblclick && setEvt(__ctx.bz, "dblclick", __bz__dblclick);
    let __ca__click = props.onDestroy;
    __ctx.ca.$p.click !== __ca__click && setEvt(__ctx.ca, "click", __ca__click);
    let __cb__value = inputValue;
    __ctx.cb.$p.value !== __cb__value && setProp(__ctx.cb, "value", __cb__value);
    setEvt(__ctx.cb, "input", e => setInputValue(e.target.value));
    let __cb__blur = handleSubmit;
    __ctx.cb.$p.blur !== __cb__blur && setEvt(__ctx.cb, "blur", __cb__blur);
    setEvt(__ctx.cb, "keydown", e => {
      if (e.which === 27) {
        props.onCancel(event);
        setInputValue(props.todo.title);
      } else if (event.which === 13) {
        handleSubmit();
      }
    });

    let __bw__class = className.join(" ");

    __ctx.bw.$p.class !== __bw__class && setAttr(__ctx.bw, "class", __bw__class);

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
    createElement(__ctx, "cc", "button", {
      $: {
        class: "clear-completed"
      },
      $e: {
        click: props.onClearCompleted
      }
    });
    renderChildren(__ctx, "cc", ["Clear completed"]);

    if (props.completedCount > 0) {
      clearButton = __ctx.cc;
    }

    createElement(__ctx, "cd", "footer", {
      $: {
        class: "footer"
      }
    });
    createElement(__ctx, "ce", "span", {
      $: {
        class: "todo-count"
      }
    });
    createElement(__ctx, "cf", "strong");
    renderChildren(__ctx, "cf", [props.count]);
    renderChildren(__ctx, "ce", [__ctx.cf, " ", activeTodoWord, " left"]);
    createElement(__ctx, "cg", "ul", {
      $: {
        class: "filters"
      }
    });
    createElement(__ctx, "ch", "li");
    createElement(__ctx, "ci", "a", {
      $: {
        href: "#/",
        class: props.nowShowing === ALL_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "ci", ["All"]);
    renderChildren(__ctx, "ch", [__ctx.ci]);
    createElement(__ctx, "cj", "li");
    createElement(__ctx, "ck", "a", {
      $: {
        href: "#/active",
        class: props.nowShowing === ACTIVE_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "ck", ["Active"]);
    renderChildren(__ctx, "cj", [__ctx.ck]);
    createElement(__ctx, "cl", "li");
    createElement(__ctx, "cm", "a", {
      $: {
        href: "#/completed",
        class: props.nowShowing === COMPLETED_TODOS ? "selected" : ""
      }
    });
    renderChildren(__ctx, "cm", ["Completed"]);
    renderChildren(__ctx, "cl", [__ctx.cm]);
    renderChildren(__ctx, "cg", [__ctx.ch, __ctx.cj, __ctx.cl]);
    renderChildren(__ctx, "cd", [__ctx.ce, __ctx.cg, clearButton]);
    __ctx.$r = __ctx.cd;

    __gctx.pHC();

    return __ctx;
  } else {
    let __cc__click = props.onClearCompleted;
    __ctx.cc.$p.click !== __cc__click && setEvt(__ctx.cc, "click", __cc__click);

    if (props.completedCount > 0) {
      clearButton = __ctx.cc;
    }

    renderChildren(__ctx, "cf", [props.count]);
    renderChildren(__ctx, "ce", [__ctx.cf, " ", activeTodoWord, " left"]);

    let __ci__class = props.nowShowing === ALL_TODOS ? "selected" : "";

    __ctx.ci.$p.class !== __ci__class && setAttr(__ctx.ci, "class", __ci__class);

    let __ck__class = props.nowShowing === ACTIVE_TODOS ? "selected" : "";

    __ctx.ck.$p.class !== __ck__class && setAttr(__ctx.ck, "class", __ck__class);

    let __cm__class = props.nowShowing === COMPLETED_TODOS ? "selected" : "";

    __ctx.cm.$p.class !== __cm__class && setAttr(__ctx.cm, "class", __cm__class);
    renderChildren(__ctx, "cd", [__ctx.ce, __ctx.cg, clearButton]);

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
      createComponent(__gctx, __ctx, "cn", TodoItem, {
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
      __ctx.$r = __ctx.cn;

      __gctx.pHC();

      return __ctx;
    } else {
      __ctx.cn.$({
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
    createElement(__ctx, "co", "section", {
      $: {
        class: "main"
      }
    });
    createElement(__ctx, "cp", "input", {
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
    renderChildren(__ctx, "cp");
    createElement(__ctx, "cq", "label", {
      $: {
        for: "toggle-all"
      }
    });
    renderChildren(__ctx, "cq");
    createElement(__ctx, "cr", "ul", {
      $: {
        class: "todo-list"
      }
    });
    renderChildren(__ctx, "cr", [todoItems]);
    renderChildren(__ctx, "co", [__ctx.cp, __ctx.cq, __ctx.cr]);

    if (todos.length) {
      main = __ctx.co;
    }

    createComponent(__gctx, __ctx, "cs", TodoFooter, {
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.cs;
    }

    createElement(__ctx, "ct", "div");
    createElement(__ctx, "cu", "header", {
      $: {
        class: "header"
      }
    });
    createElement(__ctx, "cv", "h1");
    renderChildren(__ctx, "cv", ["todos"]);
    createElement(__ctx, "cw", "input", {
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
    renderChildren(__ctx, "cw");
    renderChildren(__ctx, "cu", [__ctx.cv, __ctx.cw]);
    renderChildren(__ctx, "ct", [__ctx.cu, main, footer]);
    __ctx.$r = __ctx.ct;

    __gctx.pHC();

    return __ctx;
  } else {
    let __cp__checked = activeTodoCount === 0;

    __ctx.cp.$p.checked !== __cp__checked && setProp(__ctx.cp, "checked", __cp__checked);
    setEvt(__ctx.cp, "change", () => {
      let completed = todos.every(t => t.completed);
      updateTodosList(todos.map(t => ({ ...t,
        completed: !completed
      })));
    });
    renderChildren(__ctx, "cr", [todoItems]);

    if (todos.length) {
      main = __ctx.co;
    }

    __ctx.cs.$({
      count: activeTodoCount,
      completedCount: completedCount,
      nowShowing: nowShowing,
      onClearCompleted: () => updateTodosList(todos.filter(t => !t.completed))
    });

    if (activeTodoCount || completedCount) {
      footer = __ctx.cs;
    }

    let __cw__value = inputValue;
    __ctx.cw.$p.value !== __cw__value && setProp(__ctx.cw, "value", __cw__value);
    setEvt(__ctx.cw, "input", e => setInputValue(e.target.value));
    setEvt(__ctx.cw, "keydown", e => {
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
    renderChildren(__ctx, "ct", [__ctx.cu, main, footer]);

    __gctx.pHC();
  }
}

mount(document.getElementById("app"), gCtx, TodoApp, null);