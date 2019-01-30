import test from "ava";
import browserEnv from "browser-env";
import { compile } from "./__compiler";

browserEnv();

test("should handle className", t => {
  let ctx = compile(
    `function Cmp(props) {
       return <div className={props.className} />;
     }`,
    { className: "foo" }
  );
  t.true(ctx.$r._.className === "foo");

  ctx.$({ className: "bar" });
  t.true(ctx.$r._.className === "bar");

  ctx.$({ className: null });
  t.true(ctx.$r._.className === "");
});

test("should gracefully handle various style value types", t => {
  let ctx = compile(
    `function Cmp() {
       return <div style={{
        display: 'block',
        left: '1px',
        top: 2,
        fontFamily: 'Arial',
      }} />;
     }`
  );

  let style = ctx.$r._.style;
  t.true(style.display === "block");
  t.true(style.left === "1px");
  t.true(style.top === "2px");
  t.true(style.fontFamily === "Arial");
});

test("should reset style values in a correct way", t => {
  let ctx = compile(
    `function Cmp() {
       return <div style={{ display: '', left: null, top: false, fontFamily: true }} />;
     }`
  );

  let style = ctx.$r._.style;
  t.true(style.display === "");
  t.true(style.left === "");
  t.true(style.top === "");
  t.true(style.fontFamily === "");
});

// TODO:
// it('should warn for unknown prop', () => {
//   const container = document.createElement('div');
//   expect(() =>
//     ReactDOM.render(<div foo={() => {}} />, container),
//   ).toWarnDev(
//     'Warning: Invalid value for prop `foo` on <div> tag. Either remove it ' +
//       'from the element, or pass a string or number value to keep ' +
//       'it in the DOM. For details, see https://fb.me/react-attribute-behavior' +
//       '\n    in div (at **)',
//   );
// });

// it('should warn for onDblClick prop', () => {
//   const container = document.createElement('div');
//   expect(() =>
//     ReactDOM.render(<div onDblClick={() => {}} />, container),
//   ).toWarnDev(
//     'Warning: Invalid event handler property `onDblClick`. Did you mean `onDoubleClick`?\n    in div (at **)',
//   );
// });

// it('should warn for unknown string event handlers', () => {
//   const container = document.createElement('div');
//   expect(() =>
//     ReactDOM.render(<div onUnknown="alert(&quot;hack&quot;)" />, container),
//   ).toWarnDev(
//     'Warning: Unknown event handler property `onUnknown`. It will be ignored.\n    in div (at **)',
//   );
//   expect(container.firstChild.hasAttribute('onUnknown')).toBe(false);
//   expect(container.firstChild.onUnknown).toBe(undefined);
//   expect(() =>
//     ReactDOM.render(<div onunknown="alert(&quot;hack&quot;)" />, container),
//   ).toWarnDev(
//     'Warning: Unknown event handler property `onunknown`. It will be ignored.\n    in div (at **)',
//   );
//   expect(container.firstChild.hasAttribute('onunknown')).toBe(false);
//   expect(container.firstChild.onunknown).toBe(undefined);
//   expect(() =>
//     ReactDOM.render(
//       <div on-unknown="alert(&quot;hack&quot;)" />,
//       container,
//     ),
//   ).toWarnDev(
//     'Warning: Unknown event handler property `on-unknown`. It will be ignored.\n    in div (at **)',
//   );
//   expect(container.firstChild.hasAttribute('on-unknown')).toBe(false);
//   expect(container.firstChild['on-unknown']).toBe(undefined);
// });

// it('should warn for unknown function event handlers', () => {
//   const container = document.createElement('div');
//   expect(() =>
//     ReactDOM.render(<div onUnknown={function() {}} />, container),
//   ).toWarnDev(
//     'Warning: Unknown event handler property `onUnknown`. It will be ignored.\n    in div (at **)',
//   );
//   expect(container.firstChild.hasAttribute('onUnknown')).toBe(false);
//   expect(container.firstChild.onUnknown).toBe(undefined);
//   expect(() =>
//     ReactDOM.render(<div onunknown={function() {}} />, container),
//   ).toWarnDev(
//     'Warning: Unknown event handler property `onunknown`. It will be ignored.\n    in div (at **)',
//   );
//   expect(container.firstChild.hasAttribute('onunknown')).toBe(false);
//   expect(container.firstChild.onunknown).toBe(undefined);
//   expect(() =>
//     ReactDOM.render(<div on-unknown={function() {}} />, container),
//   ).toWarnDev(
//     'Warning: Unknown event handler property `on-unknown`. It will be ignored.\n    in div (at **)',
//   );
//   expect(container.firstChild.hasAttribute('on-unknown')).toBe(false);
//   expect(container.firstChild['on-unknown']).toBe(undefined);
// });

// it('should warn for badly cased React attributes', () => {
//   const container = document.createElement('div');
//   expect(() => ReactDOM.render(<div CHILDREN="5" />, container)).toWarnDev(
//     'Warning: Invalid DOM property `CHILDREN`. Did you mean `children`?\n    in div (at **)',
//   );
//   expect(container.firstChild.getAttribute('CHILDREN')).toBe('5');
// });

test("should not set null/undefined attributes", t => {
  let ctx = compile(
    `function Cmp() {
       return <img src={null} data-foo={undefined} />;
     }`
  );

  t.false(ctx.$r._.hasAttribute("src"));
  t.false(ctx.$r._.hasAttribute("data-foo"));
});

test("should apply React-specific aliases to HTML elements", t => {
  let ctx = compile(
    `function Cmp() {
       return <form acceptCharset="foo" />;
     }`
  );
  t.true(ctx.$r._.getAttribute("accept-charset") === "foo");
  t.false(ctx.$r._.hasAttribute("acceptCharset"));
});

test("should properly update custom attributes on custom elements", t => {
  let ctx = compile(
    `function Cmp(props) {
       return <some-custom-element foo={props.foo} />;
     }`,
    { foo: "bar" }
  );
  ctx.$({ foo: "baz" });
  t.true(ctx.$r._.getAttribute("foo") === "baz");
  t.false(ctx.$r._.hasAttribute("acceptCharset"));
});

// TODO:
// it('should not apply React-specific aliases to custom elements', () => {
//   const container = document.createElement('div');
//   ReactDOM.render(<some-custom-element arabicForm="foo" />, container);
//   const node = container.firstChild;
//   // Should not get transformed to arabic-form as SVG would be.
//   expect(node.getAttribute('arabicForm')).toBe('foo');
//   expect(node.hasAttribute('arabic-form')).toBe(false);
//   // Test attribute update.
//   ReactDOM.render(<some-custom-element arabicForm="boo" />, container);
//   expect(node.getAttribute('arabicForm')).toBe('boo');
//   // Test attribute removal and addition.
//   ReactDOM.render(<some-custom-element acceptCharset="buzz" />, container);
//   // Verify the previous attribute was removed.
//   expect(node.hasAttribute('arabicForm')).toBe(false);
//   // Should not get transformed to accept-charset as HTML would be.
//   expect(node.getAttribute('acceptCharset')).toBe('buzz');
//   expect(node.hasAttribute('accept-charset')).toBe(false);
// });

// TODO:
// it('should clear a single style prop when changing `style`', () => {
//   let styles = {display: 'none', color: 'red'};
//   const container = document.createElement('div');
//   ReactDOM.render(<div style={styles} />, container);

//   const stubStyle = container.firstChild.style;

//   styles = {color: 'green'};
//   ReactDOM.render(<div style={styles} />, container);
//   expect(stubStyle.display).toEqual('');
//   expect(stubStyle.color).toEqual('green');
// });

// it('should clear all the styles when removing `style`', () => {
//   const styles = {display: 'none', color: 'red'};
//   const container = document.createElement('div');
//   ReactDOM.render(<div style={styles} />, container);

//   const stubStyle = container.firstChild.style;

//   ReactDOM.render(<div />, container);
//   expect(stubStyle.display).toEqual('');
//   expect(stubStyle.color).toEqual('');
// });

// it('should update styles when `style` changes from null to object', () => {
//   const container = document.createElement('div');
//   const styles = {color: 'red'};
//   ReactDOM.render(<div style={styles} />, container);
//   ReactDOM.render(<div />, container);
//   ReactDOM.render(<div style={styles} />, container);

//   const stubStyle = container.firstChild.style;
//   expect(stubStyle.color).toEqual('red');
// });
