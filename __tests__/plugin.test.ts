import dedent from "dedent";
import {transformFileSync, transformSync} from "@babel/core";

function runPlugin(code: string) {
    const res = transformSync(code, {
        plugins: [__dirname + "/../src/plugin.ts"],
    });

    if (!res) {
        throw new Error("plugin failed");
    }

    return res;
}

test("can transform property access to oc call", async () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar.baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "ts-optchain";
    oc(data, ["foo", "bar", "baz", "last"]);
    `);
});

test("can pass the default value", async () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar.baz.last("default");
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "ts-optchain";
    oc(data, ["foo", "bar", "baz", "last"], "default");
    `);
});

test("can handle complicated expressions in default values", async () => {
    const code = dedent`
    import { oc } from "ts-optchain";
    oc(data).foo.bar.baz.last(something ? getDefault() : other());
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "ts-optchain";
    oc(data, ["foo", "bar", "baz", "last"], something ? getDefault() : other());
    `);
});

test("can use local import alias", async () => {
    const code = dedent`
    import { oc as custom } from "ts-optchain";
    custom(data).foo.bar.baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc as custom } from "ts-optchain";
    custom(data, ["foo", "bar", "baz", "last"]);
    `);
});
