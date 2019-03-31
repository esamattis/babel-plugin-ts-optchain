import * as BabelTypes from "@babel/types";
import {Visitor, NodePath} from "@babel/traverse";

type CallValue = BabelTypes.CallExpression["arguments"][0];

export const RUNTIME_IMPORT = "babel-plugin-ts-optchain/lib/runtime";

export interface PluginOptions {
    opts?: {
        target?: string;
        runtime?: string;
    };
    file: {
        path: NodePath;
    };
}

export interface Babel {
    types: typeof BabelTypes;
}

function getAccessorExpressionPath(
    t: typeof BabelTypes,
    path: NodePath,
    accessorExpressionPath?: BabelTypes.Expression[],
): {
    accessorExpressionPath: BabelTypes.Expression[];
    endNodePath: NodePath;
    defaultValue?: CallValue;
} {
    if (!accessorExpressionPath) {
        accessorExpressionPath = [];
    }

    if (!t.isMemberExpression(path.container)) {
        let defaultValue: CallValue | undefined = undefined;

        if (t.isCallExpression(path.parent)) {
            defaultValue = path.parent.arguments[0];
        } else {
            if (t.isMemberExpression(path.node)) {
                throw new Error(
                    "Last property accessor in ts-optchain must be a function call. " +
                        `Add () to .${path.node.property.name};`,
                );
            } else {
                throw new Error(
                    "You must add at least one property accessor to oc() calls",
                );
            }
        }

        return {
            accessorExpressionPath,
            endNodePath: path.parentPath,
            defaultValue: defaultValue,
        };
    }

    const prop = path.container.property;
    let expression: BabelTypes.Expression;

    if (path.container.computed) {
        // Pass computed properties as is.
        // Ex. oc(data)[ding()]() -> ding()
        expression = prop;
    } else {
        // Convert static property accessors to strings
        // Ex. oc().foo() -> "foo"
        expression = t.stringLiteral(prop.name);
    }

    return getAccessorExpressionPath(
        t,
        path.parentPath,
        accessorExpressionPath.concat(expression),
    );
}

export function transformOptchainCall(
    t: Babel["types"],
    path: NodePath<BabelTypes.CallExpression>,
) {
    // Avoid infinite recursion on already transformed nodes
    if (path.node.arguments.length > 1) {
        return;
    }

    const {
        accessorExpressionPath,
        endNodePath,
        defaultValue,
    } = getAccessorExpressionPath(t, path);

    const callArgs = [
        path.node.arguments[0],
        t.arrayExpression(accessorExpressionPath),
    ];

    if (defaultValue) {
        callArgs.push(defaultValue);
    }

    endNodePath.replaceWith(t.callExpression(path.node.callee, callArgs));
}

export default function tsOptChainPlugin(
    babel: Babel,
): {visitor: Visitor<PluginOptions>} {
    const t = babel.types;

    /**
     * Local name of the oc import from ts-optchain if any
     */
    let name: string | null = null;

    return {
        visitor: {
            ImportDeclaration(path, state) {
                const opts = state.opts || {};

                const target = opts.target || "ts-optchain";

                if (path.node.source.value !== target) {
                    return;
                }

                path.node.source.value = opts.runtime || RUNTIME_IMPORT;

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
                // Disable if no ts-optchain is imported
                if (!name) {
                    return;
                }

                // Handle only the oc() calls from the ts-optchain import
                if (!t.isIdentifier(path.node.callee, {name: name})) {
                    return;
                }

                transformOptchainCall(t, path);
            },
        },
    };
}
