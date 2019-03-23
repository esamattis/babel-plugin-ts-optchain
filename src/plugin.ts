import * as types from "@babel/types";
import {Visitor, NodePath} from "@babel/traverse";

function getMemberExpressionPath(
    t: typeof types,
    path: NodePath,
    memberPath?: string[],
): {memberPath: string[]; startPath: NodePath} {
    if (!memberPath) {
        memberPath = [];
    }

    if (!t.isMemberExpression(path.container)) {
        return {memberPath, startPath: path.parentPath};
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

                const {memberPath, startPath} = getMemberExpressionPath(
                    t,
                    path,
                );

                startPath.replaceWith(
                    t.callExpression(t.identifier("getOC"), [
                        path.node.arguments[0],
                        t.arrayExpression(
                            memberPath.map(p => t.stringLiteral(p)),
                        ),
                    ]),
                );
            },
        },
    };
}
