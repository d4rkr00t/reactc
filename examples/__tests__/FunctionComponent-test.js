import test from "ava";
import browserEnv from "browser-env";
import { compile } from "./__compiler";

browserEnv();

test("should render stateless component", t => {
  let ctx = compile(
    `function Cmp(props) {
    return <div>{props.name}</div>;
  }`,
    { name: "A" }
  );
  t.true(ctx.$r._.textContent === "A");
});

test("should update stateless component", t => {
  let ctx = compile(
    `function Cmp(props) {
    return <div>{props.name}</div>;
  }`,
    { name: "A" }
  );
  t.true(ctx.$r._.textContent === "A");
  ctx.$({ name: "B" });
  t.true(ctx.$r._.textContent === "B");
});

// TODO:
// it('should unmount stateless component', () => {
//   const container = document.createElement('div');

//   ReactDOM.render(<FunctionComponent name="A" />, container);
//   expect(container.textContent).toBe('A');

//   ReactDOM.unmountComponentAtNode(container);
//   expect(container.textContent).toBe('');
// });

// it('should pass context thru stateless component', () => {
//   class Child extends React.Component {
//     static contextTypes = {
//       test: PropTypes.string.isRequired,
//     };

//     render() {
//       return <div>{this.context.test}</div>;
//     }
//   }

//   function Parent() {
//     return <Child />;
//   }

//   class GrandParent extends React.Component {
//     static childContextTypes = {
//       test: PropTypes.string.isRequired,
//     };

//     getChildContext() {
//       return {test: this.props.test};
//     }

//     render() {
//       return <Parent />;
//     }
//   }

//   const el = document.createElement('div');
//   ReactDOM.render(<GrandParent test="test" />, el);

//   expect(el.textContent).toBe('test');

//   ReactDOM.render(<GrandParent test="mest" />, el);

//   expect(el.textContent).toBe('mest');
// });

// TODO:
// it('should throw when stateless component returns undefined', () => {
//     function NotAComponent() {}
//     expect(function() {
//       ReactTestUtils.renderIntoDocument(
//         <div>
//           <NotAComponent />
//         </div>,
//       );
//     }).toThrowError(
//       'NotAComponent(...): Nothing was returned from render. ' +
//         'This usually means a return statement is missing. Or, to render nothing, return null.',
//     );
//   });

// TODO:
// it('should receive context', () => {
//   class Parent extends React.Component {
//     static childContextTypes = {
//       lang: PropTypes.string,
//     };

//     getChildContext() {
//       return {lang: 'en'};
//     }

//     render() {
//       return <Child />;
//     }
//   }

//   function Child(props, context) {
//     return <div>{context.lang}</div>;
//   }
//   Child.contextTypes = {lang: PropTypes.string};

//   const el = document.createElement('div');
//   ReactDOM.render(<Parent />, el);
//   expect(el.textContent).toBe('en');
// });

test("should work with arrow functions", t => {
  let ctx = compile(
    `const Cmp = (props) => {
       return <div>A</div>;
    };`
  );
  t.true(ctx.$r._.textContent === "A");
});

test("should work with arrow functions short syntax", t => {
  let ctx = compile(`const Cmp = (props) => <div>A</div>;`);
  t.true(ctx.$r._.textContent === "A");
});
