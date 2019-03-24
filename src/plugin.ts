import * as types from "@babel/types";
import {Visitor, NodePath} from "@babel/traverse";

type CallValue = types.CallExpression["arguments"][0];

function getMemberExpressionPath(
    t: typeof types,
    path: NodePath,
    properties?: (string | number)[],
): {
    properties: (string | number)[];
    startPath: NodePath;
    defaultValue?: CallValue;
} {
    if (!properties) {
        properties = [];
    }

    if (!t.isMemberExpression(path.container)) {
        let defaultValue: CallValue | undefined = undefined;

        if (t.isCallExpression(path.parent)) {
            defaultValue = path.parent.arguments[0];
        }

        return {
            properties: properties,
            startPath: path.parentPath,
            defaultValue: defaultValue,
        };
    }

    let key: string | number;

    if (path.container.computed) {
        if (t.isNumericLiteral(path.container.property)) {
            key = path.container.property.value;
        } else {
            throw new Error("Cannot find key");
        }
    } else {
        key = path.container.property.name;
    }

    return getMemberExpressionPath(t, path.parentPath, properties.concat(key));
}

export default function(babel: {types: typeof types}): Record<string, Visitor> {
    const {types: t} = babel;

    let name: string | null = null;

    return {
        visitor: {
            ImportDeclaration(path) {
                if (path.node.source.value !== "ts-optchain") {
                    return;
                }

                path.node.source.value = "babel-plugin-ts-optchain/lib/runtime";

                for (const s of path.node.specifiers) {
                    if (!t.isImportSpecifier(s)) {
                        continue;
                    }

                    if (s.imported.name === "oc") {
                        name = s.local.name;
                    }
                }
            },

            CallExpression(path) {
                if (!name) {
                    return;
                }

                if (!t.isIdentifier(path.node.callee, {name: name})) {
                    return;
                }

                // Avoid infinite recursion on already changed nodes
                if (t.isCallExpression(path.node)) {
                    if (path.node.arguments.length > 1) {
                        return;
                    }
                }

                const {
                    properties: memberPath,
                    startPath,
                    defaultValue,
                } = getMemberExpressionPath(t, path);

                const callArgs = [
                    path.node.arguments[0],
                    t.arrayExpression(
                        memberPath.map(key => {
                            if (typeof key === "number") {
                                return t.numericLiteral(key);
                            }
                            return t.stringLiteral(key);
                        }),
                    ),
                ];

                if (defaultValue) {
                    callArgs.push(defaultValue);
                }

                startPath.replaceWith(
                    t.callExpression(path.node.callee, callArgs),
                );
            },
        },
    };
}
