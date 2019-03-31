import {transform} from "@babel/core";
import fs from "fs";

function main() {
    const source = fs
        .readFileSync("__tests__/upstream-ts-optchain-tests.source")
        .toString();
    const res = transform(source, {
        babelrc: false,
        filename: "test.ts",
        presets: [
            "@babel/preset-typescript",
            [
                "@babel/preset-env",
                {
                    targets: {node: "current"},
                },
            ],
        ],
        plugins: [
            [
                __dirname + "/../src/plugin.ts",
                {
                    target: "../index",
                    runtime: "../src/runtime",
                },
            ],
        ],
    });

    if (!res) {
        throw new Error("plugin failed");
    }

    console.log(res.code);
}

main();
