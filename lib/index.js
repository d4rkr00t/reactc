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
        let { id, params, body } = path.node;

        if (!isReactFunctionComponent(path)) return false;
        if (params.find(param => param.name === "__context")) {
          transformComponent(path);
          return false;
        }

        let updatedParams = [
          params[0] || t.identifier("__props"),
          t.identifier("__context")
        ];
        path.replaceWith(
          t.functionDeclaration(id, updatedParams, t.blockStatement(body.body))
        );
      },
      CallExpression(path) {
        if (!isReactDOMRenderCallExpression(path.node)) return;
        path.replaceWith(transformReactDOMRender(path));
      }
    }
  };
});
