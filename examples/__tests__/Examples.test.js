import { html } from "js-beautify";
import test from "ava";
import browserEnv from "browser-env";

browserEnv();
window.localStorage = {
  getItem: () => null,
  setItem: () => null
};

[
  "simple",
  "nested-components",
  "nested-elements-complex",
  "nested-elements",
  "simple-hooks",
  "todomvc"
].forEach(name => {
  test(name, t => {
    const div = document.createElement("div");
    div.id = "app";
    document.body.appendChild(div);
    require(`../examples/${name}.dist.js`);
    let result = html(div.innerHTML);
    document.body.innerHTML = "";

    t.snapshot(result);
  });
});
