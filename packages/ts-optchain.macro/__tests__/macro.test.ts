import dedent from "dedent";
import {transform} from "@babel/core";

function runPlugin(code: string) {
    const res = transform(code, {
        babelrc: false,
        filename: "test.ts",
        root: __dirname,
        plugins: ["babel-plugin-macros"],
    });

    if (!res) {
        throw new Error("plugin failed");
    }

    return res;
}

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
