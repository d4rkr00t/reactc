let { declare } = require("@babel/helper-plugin-utils");
let { types: t } = require("@babel/core");
let isReactFunctionComponent = require("./utils/checks/is-react-fc");
let isReactDOMRenderCallExpression = require("./utils/checks/is-react-dom-render");
let ch = require("./utils/create-helpers");
let transformReactDOMRender = require("./transforms/react-dom");
let transformComponent = require("./transforms/component");

module.exports = declare(() => {
  return {
    visitor: {
      Program: {
        exit(path) {
          path.traverse({
            FunctionDeclaration(path) {
              let { id, params } = path.node;
              if (!isReactFunctionComponent(path)) return false;

              let updatedParams = [
                ...(params.length ? params : [t.identifier("__props")]),
                ch.gCtxId,
                ch.pCtxId
              ];

              path.set("params", updatedParams);
              path
                .get("body")
                .unshiftContainer("body", [
                  ch.initComponentContext(id, updatedParams[0], true),
                  ch.setHooksContext()
                ]);

              path.traverse({
                FunctionExpression(path) {
                  if (!isReactFunctionComponent(path)) return false;
                  path
                    .get("body")
                    .unshiftContainer("body", [
                      ch.initComponentContext(),
                      ch.setHooksContext()
                    ]);
                  transformComponent(path);
                },
                FunctionDeclaration(path) {
                  if (!isReactFunctionComponent(path)) return false;
                  path
                    .get("body")
                    .unshiftContainer("body", [
                      ch.initComponentContext(),
                      ch.setHooksContext()
                    ]);
                  transformComponent(path);
                },
                ArrowFunctionExpression(path) {
                  if (!isReactFunctionComponent(path)) return false;
                  path
                    .get("body")
                    .unshiftContainer("body", [
                      ch.initComponentContext(),
                      ch.setHooksContext()
                    ]);
                  transformComponent(path);
                }
              });

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
