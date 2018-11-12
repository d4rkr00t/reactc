// import React from "react";
// import ReactDOM from "react-dom";
function App(__props, __context) {
  var __el1 = document.createElement("div");

  var __el2 = document.createTextNode("Hello ReactC");

  __context.__root.appendChild(__el1);

  __el1.appendChild(__el2);
}

App(null, {
  __root: document.getElementById("app")
});
