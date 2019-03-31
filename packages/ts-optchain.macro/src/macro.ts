import {NodePath} from "@babel/traverse";
import * as BabelTypes from "@babel/types";

import {
    PluginOptions,
    Babel,
    transformOptchainCall,
    RUNTIME_IMPORT,
} from "babel-plugin-ts-optchain";

const {createMacro} = require("babel-plugin-macros");

interface Macro {
    babel: Babel;
    state: PluginOptions;
    references: Record<string, NodePath[]>;
}

function transfromMacroImport(
    t: typeof BabelTypes,
    path: NodePath<BabelTypes.CallExpression>,
) {
    if (!t.isIdentifier(path.node.callee)) {
        return;
    }

    const name = path.node.callee.name;

    const importDecl = path.scope.bindings[name].path.parentPath.node;

    if (t.isImportDeclaration(importDecl)) {
        importDecl.source.value = RUNTIME_IMPORT;
    }
}

export default createMacro(function tsOptChainMacro(macro: Macro) {
    const t = macro.babel.types;

    for (const key of Object.keys(macro.references)) {
        const paths = macro.references[key];
        for (const path of paths) {
            if (t.isCallExpression(path.parent)) {
                const callPath = path.parentPath as NodePath<
                    BabelTypes.CallExpression
                >;
                transfromMacroImport(t, callPath);
                transformOptchainCall(t, callPath);
            }
        }
    }

    return {
        keepImports: true,
    };
});
