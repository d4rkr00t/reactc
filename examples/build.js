let fs = require("fs");
let path = require("path");
let chalk = require("chalk");
let Terser = require("terser");
let gzipSize = require("gzip-size");
let babel = require("@babel/core");
let options = {
  presets: ["@babel/preset-react"],
  plugins: [require.resolve("@reactc/compiler")]
};

let name = process.argv[2];
let runtimeContent = fs.readFileSync(
  require.resolve("@reactc/runtime"),
  "utf8"
);

if (name !== "all") {
  compile(name, true);
} else {
  fs.readdirSync(path.join(__dirname, "examples"))
    .filter(file => file.match(/^((?!dist).)*.js$/))
    .map(file => path.basename(file, ".js"))
    .forEach(file => compile(file));
}

function compile(file, isVerbose) {
  let htmlPath = path.join(__dirname, "examples", `${file}.html`);
  let filePath = path.join(__dirname, "examples", `${file}.js`);
  let exampleContent = fs.readFileSync(filePath, "utf8");
  let transformed = babel.transform(exampleContent, options).code;
  let withRuntime = `${runtimeContent}\n/* END RUNTIME */\n\n${transformed}`;
  let minified = Terser.minify(withRuntime, { toplevel: true }).code;
  let runtimeMinified = Terser.minify(`renderChildren(); ${runtimeContent}`, {
    toplevel: true
  }).code;

  fs.writeFileSync(
    path.join(__dirname, "examples", `${file}.dist.js`),
    withRuntime,
    "utf8"
  );
  fs.writeFileSync(
    path.join(__dirname, "examples", `${file}.dist.min.js`),
    minified,
    "utf8"
  );

  console.log(chalk.green(`Compiled – ${filePath}`));
  console.log();

  if (!isVerbose) {
    return;
  }

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
  console.log();
  console.log(chalk.dim(`Example: ${htmlPath}`));
}
