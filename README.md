[!] Need to only keep track of Components instructions

```js
Map<Updater, CCTX>

render((ctx) => ({ _: el, $: updater, $\$: props, ...instructions }));

updater(props, cCtx);

createComponent(pctx, ctx, localId, Cmp, props)
  => ctx[localId] = cCtx;
createElement(ctx, localId, 'type', attrs)
  => ctx[localId] = { _: el, \$\$: attrs };

renderChildren(ctx, parentLocalId, [localId1, localId2, localId3]);
```
