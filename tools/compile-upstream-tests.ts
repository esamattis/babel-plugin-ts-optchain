import {transformFileSync} from "@babel/core";

function main() {
    const res = transformFileSync(
        "__tests__/upstream-ts-optchain-tests-source.ts",
        {
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
        },
    );

    if (!res) {
        throw new Error("plugin failed");
    }

    console.log(res.code);
}

main();
