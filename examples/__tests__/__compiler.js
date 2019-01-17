let fs = require("fs");
let babel = require("@babel/core");
let options = {
  presets: ["@babel/preset-react"],
  plugins: [require.resolve("@reactc/compiler")]
};
let runtimeContent = fs.readFileSync(
  require.resolve("@reactc/runtime"),
  "utf8"
);

export function compile(code, props) {
  let transformed = babel.transform(code, options).code;
  let compiled = `(() => {
    ${runtimeContent}
    ${transformed}
    return mount(document.createDocumentFragment(), gCtx, Cmp, ${
      props ? JSON.stringify(props) : "null"
    });
   })()`;
  return eval(compiled);
}
