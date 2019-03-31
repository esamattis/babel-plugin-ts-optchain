import dedent from "dedent";
import {transform} from "@babel/core";

function runPlugin(code: string) {
    const res = transform(code, {
        babelrc: false,
        filename: "test.ts",
        plugins: ["babel-plugin-macros"],
        // presets: [
        //     "@babel/preset-typescript",
        //     [
        //         "@babel/preset-env",
        //         {
        //             targets: {node: "current"},
        //         },
        //     ],
        // ],
    });

    if (!res) {
        throw new Error("plugin failed");
    }

    return res;
}

test.skip("can convert ts-optchain import", async () => {
    const code = dedent`
    import "./__tests__/entry.macro";
    import { oc } from "ts-optchain";
    oc(data).foo.bar.baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", "baz", "last"]);
    `);
});

test("oc can be imported from the macro", async () => {
    const code = dedent`
    import { oc } from  "./__tests__/entry.macro";
    oc(data).foo.bar.baz.last();
    `;

    const res = runPlugin(code);
    expect(res.code).toEqual(dedent`
    import { oc } from "babel-plugin-ts-optchain/lib/runtime";
    oc(data, ["foo", "bar", "baz", "last"]);
    `);
});
