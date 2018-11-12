let fs = require("fs");
let path = require("path");
let babel = require("@babel/core");
let options = {
  plugins: [path.join(__dirname, "..", "lib", "index.js")]
};

let name = process.argv[2];
let exampleContent = fs.readFileSync(
  path.join(__dirname, `${name}.js`),
  "utf8"
);
let runtimeContent = fs.readFileSync(
  path.join(__dirname, "..", "lib", `runtime.js`),
  "utf8"
);
let transformed = babel.transform(exampleContent, options);

console.log(`${transformed.code}\n\n\n${runtimeContent}`);

fs.writeFileSync(
  path.join(__dirname, `${name}.dist.js`),
  `${transformed.code}\n\n\n${runtimeContent}`,
  "utf8"
);
