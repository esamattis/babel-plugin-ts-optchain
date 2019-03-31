# babel-plugin-ts-optchain

Babel plugin for transpiling legacy browser support to [ts-optchain][] by
removing Proxy usage.

Input:

```ts
import { oc } from "ts-optchain";
oc(data).foo.bar("default");
```

Output

```ts
import { oc } from "babel-plugin-ts-optchain/lib/runtime";
oc(data, ["foo", "bar"], "default");
```

The `babel-plugin-ts-optchain/lib/runtime` is a tiny [mb][] like function.

## Install

    npm install babel-plugin-ts-optchain

and add it to your `.babelrc` with `@babel/preset-typescript`

```json
{
  "presets": ["@babel/preset-typescript"],
  "plugins": ["ts-optchain"]
}
```

## Babel Macro

There's also a [Babel Macro](https://github.com/kentcdodds/babel-plugin-macros) variant for [Create React App](https://facebook.github.io/create-react-app/) and other users who cannot use or don't want to use custom Babel Plugins.

Install the macro with

    npm install ts-optchain.macro

Then just in your code import `oc` from `ts-optchain.macro` instead of
`ts-optchain`. There's no need to install `ts-optchain` separately.

```ts
import { oc } from "ts-optchain.macro";
oc(data).foo.bar("default");
```

## Limitations

You must call `oc()` in a single chain. Eg. this does not work:

```ts
const x = oc(data);
const bar = x.foo.bar();
```

Write it like this

```ts
const bar = oc(data).foo.bar();
```

[ts-optchain]: https://github.com/rimeto/ts-optchain
[mb]: https://github.com/burakcan/mb
