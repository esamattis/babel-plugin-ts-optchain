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

    return {
        visitor: {
            CallExpression(path) {
                if (!t.isIdentifier(path.node.callee, {name: "oc"})) {
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
