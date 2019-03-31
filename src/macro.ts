import {NodePath} from "@babel/traverse";
import * as BabelTypes from "@babel/types";

import {
    PluginOptions,
    Babel,
    transformOptchainCall,
    RUNTIME_IMPORT,
} from "./plugin";

const {createMacro} = require("babel-plugin-macros");

interface Macro {
    babel: Babel;
    state: PluginOptions;
    references: Record<string, NodePath[]>;
}

function transfromMacroImport(t: typeof BabelTypes, path: NodePath) {
    if (!t.isIdentifier(path.node)) {
        return;
    }

    const importDecl =
        path.parentPath.scope.bindings[path.node.name].path.parentPath.node;

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
                transfromMacroImport(t, path);
                transformOptchainCall(t, path.parentPath as NodePath<
                    BabelTypes.CallExpression
                >);
            }
        }
    }

    return {
        keepImports: true,
    };
});
