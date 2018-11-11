const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");
const options = {
  plugins: [path.join(__dirname, "..", "lib", "index.js")]
};

const exampleContent = fs.readFileSync(
  path.join(__dirname, "simple.js"),
  "utf8"
);
const transformed = babel.transform(exampleContent, options);
console.log(transformed.code);

fs.writeFileSync(
  path.join(__dirname, "simple.dist.js"),
  transformed.code,
  "utf8"
);
