import test from "ava";

test("should support rendering to different child types over time", t => {
  t.pass();
});

// TODO:
// it('should support rendering to different child types over time', () => {
//   const instance = ReactTestUtils.renderIntoDocument(<MorphingComponent />);
//   let el = ReactDOM.findDOMNode(instance);
//   expect(el.tagName).toBe('A');

//   instance._toggleActivatedState();
//   el = ReactDOM.findDOMNode(instance);
//   expect(el.tagName).toBe('B');

//   instance._toggleActivatedState();
//   el = ReactDOM.findDOMNode(instance);
//   expect(el.tagName).toBe('A');
// });

// it('should react to state changes from callbacks', () => {
//   const container = document.createElement('div');
//   document.body.appendChild(container);
//   try {
//     const instance = ReactDOM.render(<MorphingComponent />, container);
//     let el = ReactDOM.findDOMNode(instance);
//     expect(el.tagName).toBe('A');
//     el.click();
//     el = ReactDOM.findDOMNode(instance);
//     expect(el.tagName).toBe('B');
//   } finally {
//     document.body.removeChild(container);
//   }
// });

// it('should rewire refs when rendering to different child types', () => {
//   const instance = ReactTestUtils.renderIntoDocument(<MorphingComponent />);

//   expect(instance.refs.x.tagName).toBe('A');
//   instance._toggleActivatedState();
//   expect(instance.refs.x.tagName).toBe('B');
//   instance._toggleActivatedState();
//   expect(instance.refs.x.tagName).toBe('A');
// });

// it('should pass context to children when not owner', () => {
//   class Parent extends React.Component {
//     render() {
//       return (
//         <Child>
//           <Grandchild />
//         </Child>
//       );
//     }
//   }

//   class Child extends React.Component {
//     static childContextTypes = {
//       foo: PropTypes.string,
//     };

//     getChildContext() {
//       return {
//         foo: 'bar',
//       };
//     }

//     render() {
//       return React.Children.only(this.props.children);
//     }
//   }

//   class Grandchild extends React.Component {
//     static contextTypes = {
//       foo: PropTypes.string,
//     };

//     render() {
//       return <div>{this.context.foo}</div>;
//     }
//   }

//   const component = ReactTestUtils.renderIntoDocument(<Parent />);
//   expect(ReactDOM.findDOMNode(component).innerHTML).toBe('bar');
// });

// it('should pass context when re-rendered for static child', () => {
//     let parentInstance = null;
//     let childInstance = null;

//     class Parent extends React.Component {
//       static childContextTypes = {
//         foo: PropTypes.string,
//         flag: PropTypes.bool,
//       };

//       state = {
//         flag: false,
//       };

//       getChildContext() {
//         return {
//           foo: 'bar',
//           flag: this.state.flag,
//         };
//       }

//       render() {
//         return React.Children.only(this.props.children);
//       }
//     }

//     class Middle extends React.Component {
//       render() {
//         return this.props.children;
//       }
//     }

//     class Child extends React.Component {
//       static contextTypes = {
//         foo: PropTypes.string,
//         flag: PropTypes.bool,
//       };

//       render() {
//         childInstance = this;
//         return <span>Child</span>;
//       }
//     }

//     parentInstance = ReactTestUtils.renderIntoDocument(
//       <Parent>
//         <Middle>
//           <Child />
//         </Middle>
//       </Parent>,
//     );

//     expect(parentInstance.state.flag).toBe(false);
//     expect(childInstance.context).toEqual({foo: 'bar', flag: false});

//     parentInstance.setState({flag: true});
//     expect(parentInstance.state.flag).toBe(true);
//     expect(childInstance.context).toEqual({foo: 'bar', flag: true});
//   });

//   it('should pass context when re-rendered for static child within a composite component', () => {
//     class Parent extends React.Component {
//       static childContextTypes = {
//         flag: PropTypes.bool,
//       };

//       state = {
//         flag: true,
//       };

//       getChildContext() {
//         return {
//           flag: this.state.flag,
//         };
//       }

//       render() {
//         return <div>{this.props.children}</div>;
//       }
//     }

//     class Child extends React.Component {
//       static contextTypes = {
//         flag: PropTypes.bool,
//       };

//       render() {
//         return <div />;
//       }
//     }

//     class Wrapper extends React.Component {
//       render() {
//         return (
//           <Parent ref="parent">
//             <Child ref="child" />
//           </Parent>
//         );
//       }
//     }

//     const wrapper = ReactTestUtils.renderIntoDocument(<Wrapper />);

//     expect(wrapper.refs.parent.state.flag).toEqual(true);
//     expect(wrapper.refs.child.context).toEqual({flag: true});

//     // We update <Parent /> while <Child /> is still a static prop relative to this update
//     wrapper.refs.parent.setState({flag: false});

//     expect(wrapper.refs.parent.state.flag).toEqual(false);
//     expect(wrapper.refs.child.context).toEqual({flag: false});
//   });

//   it('should pass context transitively', () => {
//     let childInstance = null;
//     let grandchildInstance = null;

//     class Parent extends React.Component {
//       static childContextTypes = {
//         foo: PropTypes.string,
//         depth: PropTypes.number,
//       };

//       getChildContext() {
//         return {
//           foo: 'bar',
//           depth: 0,
//         };
//       }

//       render() {
//         return <Child />;
//       }
//     }

//     class Child extends React.Component {
//       static contextTypes = {
//         foo: PropTypes.string,
//         depth: PropTypes.number,
//       };

//       static childContextTypes = {
//         depth: PropTypes.number,
//       };

//       getChildContext() {
//         return {
//           depth: this.context.depth + 1,
//         };
//       }

//       render() {
//         childInstance = this;
//         return <Grandchild />;
//       }
//     }

//     class Grandchild extends React.Component {
//       static contextTypes = {
//         foo: PropTypes.string,
//         depth: PropTypes.number,
//       };

//       render() {
//         grandchildInstance = this;
//         return <div />;
//       }
//     }

//     ReactTestUtils.renderIntoDocument(<Parent />);
//     expect(childInstance.context).toEqual({foo: 'bar', depth: 0});
//     expect(grandchildInstance.context).toEqual({foo: 'bar', depth: 1});
//   });

//   it('should pass context when re-rendered', () => {
//     let parentInstance = null;
//     let childInstance = null;

//     class Parent extends React.Component {
//       static childContextTypes = {
//         foo: PropTypes.string,
//         depth: PropTypes.number,
//       };

//       state = {
//         flag: false,
//       };

//       getChildContext() {
//         return {
//           foo: 'bar',
//           depth: 0,
//         };
//       }

//       render() {
//         let output = <Child />;
//         if (!this.state.flag) {
//           output = <span>Child</span>;
//         }
//         return output;
//       }
//     }

//     class Child extends React.Component {
//       static contextTypes = {
//         foo: PropTypes.string,
//         depth: PropTypes.number,
//       };

//       render() {
//         childInstance = this;
//         return <span>Child</span>;
//       }
//     }

//     parentInstance = ReactTestUtils.renderIntoDocument(<Parent />);
//     expect(childInstance).toBeNull();

//     expect(parentInstance.state.flag).toBe(false);
//     ReactDOM.unstable_batchedUpdates(function() {
//       parentInstance.setState({flag: true});
//     });
//     expect(parentInstance.state.flag).toBe(true);

//     expect(childInstance.context).toEqual({foo: 'bar', depth: 0});
//   });

//   it('unmasked context propagates through updates', () => {
//     class Leaf extends React.Component {
//       static contextTypes = {
//         foo: PropTypes.string.isRequired,
//       };

//       UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
//         expect('foo' in nextContext).toBe(true);
//       }

//       shouldComponentUpdate(nextProps, nextState, nextContext) {
//         expect('foo' in nextContext).toBe(true);
//         return true;
//       }

//       render() {
//         return <span>{this.context.foo}</span>;
//       }
//     }

//     class Intermediary extends React.Component {
//       UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
//         expect('foo' in nextContext).toBe(false);
//       }

//       shouldComponentUpdate(nextProps, nextState, nextContext) {
//         expect('foo' in nextContext).toBe(false);
//         return true;
//       }

//       render() {
//         return <Leaf />;
//       }
//     }

//     class Parent extends React.Component {
//       static childContextTypes = {
//         foo: PropTypes.string,
//       };

//       getChildContext() {
//         return {
//           foo: this.props.cntxt,
//         };
//       }

//       render() {
//         return <Intermediary />;
//       }
//     }

//     const div = document.createElement('div');
//     ReactDOM.render(<Parent cntxt="noise" />, div);
//     expect(div.children[0].innerHTML).toBe('noise');
//     div.children[0].innerHTML = 'aliens';
//     div.children[0].id = 'aliens';
//     expect(div.children[0].innerHTML).toBe('aliens');
//     expect(div.children[0].id).toBe('aliens');
//     ReactDOM.render(<Parent cntxt="bar" />, div);
//     expect(div.children[0].innerHTML).toBe('bar');
//     expect(div.children[0].id).toBe('aliens');
//   });

// it('context should be passed down from the parent', () => {
//   class Parent extends React.Component {
//     static childContextTypes = {
//       foo: PropTypes.string,
//     };

//     getChildContext() {
//       return {
//         foo: 'bar',
//       };
//     }

//     render() {
//       return <div>{this.props.children}</div>;
//     }
//   }

//   class Component extends React.Component {
//     static contextTypes = {
//       foo: PropTypes.string.isRequired,
//     };

//     render() {
//       return <div />;
//     }
//   }

//   const div = document.createElement('div');
//   ReactDOM.render(
//     <Parent>
//       <Component />
//     </Parent>,
//     div,
//   );
// });
