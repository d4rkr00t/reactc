import test from "ava";
import browserEnv from "browser-env";
import { compile } from "./__compiler";

browserEnv();

test("should bubble onSubmit", t => {
  let ctx = compile(
    `
     function Child() {
      return (
        <form>
          <input type="submit" id="button" />
        </form>
      );
     }

     function Cmp(props) {
       let [count, setCount] = useState(1);
       return (
        <div
          data-count={count}
          onSubmit={event => {
            event.preventDefault();
            setCount(++count);
          }}
        >
          <Child />
        </div>
      );
     }`
  );
  let button = ctx.$r._.querySelector("#button");
  button.click();
  t.true(ctx.$r._.dataset.count === "1");
});

test("should allow children to be passed as an argument", t => {
  let ctx = compile(
    `
     function Cmp(props) {
       return (
        <div>
          {props.children}
        </div>
      );
     }`,
    { children: "child" }
  );
  t.true(ctx.$r._.innerHTML === "child");
});

// TODO:
// test("should overwrite props.children with children argument", t => {
//   let ctx = compile(
//     `function Child(props) {
//       return<div>
//         {props.children}
//       </div>
//      }

//      function Cmp() {
//        return (
//         <Child children="fakechild">
//           child
//         </Child>
//       );
//      }`,
//   );
//   t.true(ctx.$r._.innerHTML === "child");
// });

test("should purge the DOM cache when removing nodes", t => {
  let ctx = compile(
    `
     function Cmp(props) {
       let dog;
       if (props.render) {
        dog = <div key="theDog" className={props.className} />;
       }
       return (
        <div>
          {dog}
          <div key="theBird" className="bird" />
        </div>
      );
     }`,
    { render: true, className: "dog" }
  );
  ctx.$({ render: false, className: "" });
  ctx.$({ render: true, className: "bigdog" });
  t.true(ctx.$r._.childNodes[0].className === "bigdog");
});

test("preserves focus", t => {
  let ctx = compile(
    `
     function Cmp(props) {
       let child;
       if (props.renderChild) {
        child = <div />;
       }

       return (
        <div>
          {child}
          <input value={props.value} id="theinput" />
        </div>
      );
     }`,
    { renderChild: false, value: "text" }
  );
  ctx.$r._.querySelector("input").focus();
  t.true(document.activeElement.id === "theinput");

  ctx.$({ renderChild: false, value: "changed text" });
  t.true(document.activeElement.id === "theinput");

  ctx.$({ renderChild: true, value: "changed text" });
  t.true(document.activeElement.id === "theinput");
});

// Doesn't work in jsdom
test.skip("calls focus() on autoFocus elements after they have been mounted to the DOM", t => {
  compile(
    `
     function Cmp() {
       return (
        <div>
          <h1>Auto-focus Test</h1>
          <input autoFocus={true} />
        </div>
      );
     }`
  );

  t.true(document.activeElement.tag === "INPUT");
});
