# babel-plugin-ts-optchain

Babel plugin for transpiling legacy browser support to [ts-optchain][] by
removing Proxy usage.

Input:

```ts
import {oc} from "ts-optchain";
oc(data).foo.bar("default");
```

Output

```ts
import {oc} from "babel-plugin-ts-optchain/lib/runtime";
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
