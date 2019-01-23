import test from "ava";
import browserEnv from "browser-env";
import { compile } from "./__compiler";

browserEnv();

test("should not render extra nodes for non-interpolated text", t => {
  let ctx = compile(
    `function Cmp(props) {
       return <div>Some text</div>;
     }`
  );
  t.true(ctx.$r._.children.length === 0);
});

test("should not render extra nodes for non-interpolated text", t => {
  let ctx = compile(
    `function Cmp(props) {
       return <div>{'Interpolated String Child'}</div>;
     }`
  );
  t.true(ctx.$r._.children.length === 0);
});

test("should not render extra nodes for non-interpolated text", t => {
  let ctx = compile(
    `function Cmp(props) {
       return <div><ul>This text causes no children in ul, just innerHTML</ul></div>;
     }`
  );
  t.true(ctx.$r._.children.length === 1);
  t.true(ctx.$r._.children[0].tagName === "UL");
  t.true(ctx.$r._.children[0].children.length === 0);
});
