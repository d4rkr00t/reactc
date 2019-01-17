import test from "ava";
import browserEnv from "browser-env";
import { compile } from "./__compiler";

browserEnv();

test("should automatically append `px` to relevant styles", t => {
  let styles = {
    left: 0,
    margin: 16,
    opacity: 0.5,
    padding: "4px"
  };
  let ctx = compile(`function Cmp() {
    return <div style={${JSON.stringify(styles)}} />;
  }`);
  t.snapshot(ctx.$r._.outerHTML);
});

test("should not append `px` to styles that might need a number", t => {
  const styles = {
    zIndex: 1,
    opacity: 0.6
  };
  let ctx = compile(`function Cmp() {
    return <div style={${JSON.stringify(styles)}} />;
  }`);
  t.snapshot(ctx.$r._.outerHTML);
});

test("should not set style attribute when no styles exist", t => {
  let ctx = compile(`function Cmp() {
    return <div />;
  }`);
  t.falsy(ctx.$r._.styles);
});

test("should not warn when setting CSS custom properties", t => {
  const styles = {
    "--foo-primary": "bla"
  };
  let ctx = compile(`function Cmp() {
    return <div style={${JSON.stringify(styles)}} />;
  }`);
  t.truthy(ctx.$r._.style.FooPrimary);
});

test("should not add units to CSS custom properties", t => {
  const styles = {
    "--foo-primary": 5
  };
  let ctx = compile(`function Cmp() {
    return <div style={${JSON.stringify(styles)}} />;
  }`);
  t.true(ctx.$r._.style.FooPrimary === "5");
});
