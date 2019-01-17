import test from "ava";
import browserEnv from "browser-env";
import { compile } from "./__compiler";

browserEnv();

test("should set values as properties by default", t => {
  let ctx = compile(`function Cmp() {
    return <div title="Tip!" />;
  }`);
  t.true(ctx.$r._.title === "Tip!");
});

test("should set values as attributes if necessary", t => {
  let ctx = compile(`function Cmp() {
    return <div role="#" />;
  }`);
  t.true(ctx.$r._.getAttribute("role") === "#");
  t.true(ctx.$r._.role !== "#");
});

test("should not remove empty attributes for special input properties", t => {
  let ctx = compile(`function Cmp() {
    return <input value="" onChange={() => {}} />;
  }`);
  t.false(ctx.$r._.hasAttribute("value"));
  t.true(ctx.$r._.value === "");
});

test("should not remove empty attributes for special option properties", t => {
  let ctx = compile(`function Cmp() {
    return (
      <select>
        <option value="">empty</option>
        <option>filled</option>
      </select>
    );
  }`);
  t.true(ctx.$r._.firstChild.value === "");
  t.true(ctx.$r._.lastChild.value === "filled");
});

test("should remove for falsey boolean properties", t => {
  let ctx = compile(`function Cmp() {
    return <div allowFullScreen={false} />;
  }`);
  t.false(ctx.$r._.hasAttribute("allowFullScreen"));
});

test("should remove when setting custom attr to null", t => {
  let ctx = compile(
    `function Cmp(props) {
    return <div data-foo={props.foo} />;
  }`,
    { foo: "bar" }
  );
  t.true(ctx.$r._.hasAttribute("data-foo"));
  ctx.$({ foo: null });
  t.false(ctx.$r._.hasAttribute("data-foo"));
});
