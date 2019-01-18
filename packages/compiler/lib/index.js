let { declare } = require("@babel/helper-plugin-utils");
let isReactFunctionComponent = require("./utils/checks/is-react-fc");
let isReactDOMRenderCallExpression = require("./utils/checks/is-react-dom-render");
let transformReactDOMRender = require("./transforms/react-dom");
let transformComponent = require("./transforms/component");

module.exports = declare(() => {
  return {
    visitor: {
      Program: {
        exit(path) {
          path.traverse({
            FunctionDeclaration(path) {
              if (!isReactFunctionComponent(path)) return;
              transformComponent(path);
            },
            ArrowFunctionExpression(path) {
              if (!isReactFunctionComponent(path)) return;
              transformComponent(path);
            },
            CallExpression(path) {
              if (!isReactDOMRenderCallExpression(path.node)) return;
              path.replaceWith(transformReactDOMRender(path));
            }
          });
        }
      }
    }
  };
});
