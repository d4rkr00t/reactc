let { declare } = require("@babel/helper-plugin-utils");
let { types: t } = require("@babel/core");
let isReactFunctionComponent = require("./checks/is-react-fc");
let isReactDOMRenderCallExpression = require("./checks/is-react-dom-render");
let transformReactDOMRender = require("./transforms/react-dom");
let transformComponent = require("./transforms/component");

module.exports = declare(() => {
  return {
    visitor: {
      FunctionDeclaration(path) {
        if (!isReactFunctionComponent(path)) return false;
        path.replaceWith(transformComponent(path));
      },
      CallExpression(path) {
        if (!isReactDOMRenderCallExpression(path.node)) return;
        path.replaceWith(transformReactDOMRender(path));
      }
    }
  };
});
