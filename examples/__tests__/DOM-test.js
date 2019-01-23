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
