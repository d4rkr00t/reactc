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

test("should remove property properly for boolean properties", t => {
  let ctx = compile(
    `function Cmp(props) {
    return <div hidden={props.hidden} />;
  }`,
    { hidden: true }
  );
  t.true(ctx.$r._.hasAttribute("hidden"));
  ctx.$({ foo: false });
  t.false(ctx.$r._.hasAttribute("hidden"));
});

// test("should always assign the value attribute for non-inputs", t => {
//   let ctx = compile(
//     `function Cmp(props) {
//     return <progress value={30} />;
//   }`
//   );
//   t.true(ctx.$r._.hasAttribute("value"));
// });

// it('should return the progress to intermediate state on null value', () => {
//   const container = document.createElement('div');
//   ReactDOM.render(<progress value={30} />, container);
//   ReactDOM.render(<progress value={null} />, container);
//   // Ensure we move progress back to an indeterminate state.
//   // Regression test for https://github.com/facebook/react/issues/6119
//   expect(container.firstChild.hasAttribute('value')).toBe(false);
// });

test("should not remove attributes for custom component tag", t => {
  let ctx = compile(`function Cmp() {
    return <my-icon size="5px" />;
  }`);
  t.true(ctx.$r._.getAttribute("size") === "5px");
});
