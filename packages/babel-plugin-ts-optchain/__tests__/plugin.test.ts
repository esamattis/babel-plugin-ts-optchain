import dedent from "dedent";
import {transform} from "@babel/core";

function runPlugin(code: string) {
    const res = transform(code, {
        babelrc: false,
        filename: "test.ts",
        plugins: [__dirname + "/../src/plugin.ts"],
    });

    if (!res) {
        throw new Error("plugin failed");
    }

    return res;
}

test("can transform property access to oc call", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar.baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", "baz", "last"]);
    `);
});

test("can handle undefined literal", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(undefined).foo.bar.baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(undefined, ["foo", "bar", "baz", "last"]);
    `);
});

test("can pass the default value", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar.baz.last("default");
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", "baz", "last"], "default");
    `);
});

test("can handle complicated expressions in default values", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar.baz.last(something ? getDefault() : other());
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", "baz", "last"], something ? getDefault() : other());
    `);
});

test("can use local import alias", () => {
    const code = dedent`
    import { oc as custom } from "ts-optchain";
    custom(data).foo.bar.baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc as custom } from "babel-plugin-ts-optchain/lib/runtime";
    custom(data, ["foo", "bar", "baz", "last"]);
    `);
});

test("does not touch oc() calls if they are not imported from ts-optchain", () => {
    const code = dedent`
    oc(data).foo.bar.baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    oc(data).foo.bar.baz.last();
    `);
});

test("can handle array access", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar[0].baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", 0, "baz", "last"]);
    `);
});

test("can handle string literal access", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar["ding"].baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", "ding", "baz", "last"]);
    `);
});

test("can handle variable accessor", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar[dong].baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", dong, "baz", "last"]);
    `);
});

test("can handle function in accessor", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar[fun(1)].baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", fun(1), "baz", "last"]);
    `);
});

test("can handle function in accessor in the leaf getter", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar.baz[last(1)]();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", "baz", last(1)]);
    `);
});

test("has good error message when chain does not end with function call", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    const foo = oc(data).foo;
    const bar = foo.bar();
    `;

    expect(() => {
        runPlugin(code);
    }).toThrow("Last property accessor in ts-optchain must be a function call");
});

test("has good error message when there are no property accessors at all", () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    const x = oc(data);
    const bar = x.bar();
    `;

    expect(() => {
        runPlugin(code);
    }).toThrow("You must add at least one property accessor to oc() calls");
});

test("properly resets the state between source files", () => {
    const file1 = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar.baz.last();
    `;

    const file2 = dedent`
    import { oc } from "notoptchain";
    oc().foo();
    `;

    transform(file1, {
        babelrc: false,
        filename: "file1.ts",
        plugins: [__dirname + "/../src/plugin.ts"],
    });

    const res = transform(file2, {
        babelrc: false,
        filename: "file1.ts",
        plugins: [__dirname + "/../src/plugin.ts"],
    });

    if (!res) {
        throw new Error("plugin failed");
    }

    expect(res.code).toEqual(dedent`
    import { oc } from "notoptchain";
    oc().foo();
    `);
});
