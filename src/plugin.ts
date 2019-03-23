import * as types from "@babel/types";
import {Visitor, NodePath} from "@babel/traverse";

type CallValue = types.CallExpression["arguments"][0];

function getMemberExpressionPath(
    t: typeof types,
    path: NodePath,
    memberPath?: string[],
): {memberPath: string[]; startPath: NodePath; defaultValue?: CallValue} {
    if (!memberPath) {
        memberPath = [];
    }

    if (!t.isMemberExpression(path.container)) {
        let defaultValue: CallValue | undefined = undefined;

        if (t.isCallExpression(path.parent)) {
            defaultValue = path.parent.arguments[0];
        }

        return {
            memberPath,
            startPath: path.parentPath,
            defaultValue: defaultValue,
        };
    }

    return getMemberExpressionPath(
        t,
        path.parentPath,
        memberPath.concat(path.container.property.name),
    );
}

export default function(babel: {types: typeof types}): Record<string, Visitor> {
    const {types: t} = babel;

    let name: string | null = null;

    return {
        visitor: {
            ImportDeclaration(path) {
                // path.node.specifiers[0].local.name
                // path.node.specifiers[0].imported.name
                if (path.node.source.value !== "ts-optchain") {
                    return;
                }

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
                    memberPath,
                    startPath,
                    defaultValue,
                } = getMemberExpressionPath(t, path);

                const callArgs = [
                    path.node.arguments[0],
                    t.arrayExpression(memberPath.map(p => t.stringLiteral(p))),
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
