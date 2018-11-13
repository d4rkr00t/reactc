let fs = require("fs");
let path = require("path");
let chalk = require("chalk");
let Terser = require("terser");
let gzipSize = require("gzip-size");
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
let transformed = babel.transform(exampleContent, options).code;
let withRuntime = `${transformed}\n\n\n${runtimeContent}`;
let minified = Terser.minify(withRuntime, { toplevel: true }).code;
let runtimeMinified = Terser.minify(`renderChildren(); ${runtimeContent}`, {
  toplevel: true
}).code;

fs.writeFileSync(path.join(__dirname, `${name}.dist.js`), withRuntime, "utf8");
fs.writeFileSync(path.join(__dirname, `${name}.dist.min.js`), minified, "utf8");

console.log(chalk.green("Compiled!"));
console.log();
console.log(chalk.dim("--"));
console.log();
console.log(chalk.dim(transformed));
console.log();
console.log(chalk.dim("--"));
console.log();
console.log(
  chalk.magenta(`Size:            ${chalk.yellow(withRuntime.length + "b")}`)
);
console.log(
  chalk.magenta(`Size min:        ${chalk.yellow(minified.length + "b")}`)
);
console.log(
  chalk.magenta(
    `Size min + gzip: ${chalk.yellow(gzipSize.sync(minified) + "b")}`
  )
);
console.log(
  chalk.magenta(
    `Runtime size min + gzip: ${chalk.yellow(
      gzipSize.sync(runtimeMinified) + "b"
    )}`
  )
);
