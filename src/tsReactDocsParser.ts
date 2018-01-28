import * as ts from 'typescript';

const defaultConfig: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.Latest,
    jsx: ts.JsxEmit.React
};

export interface SymbolDoc {
    name: string;
    description: string;
}

export interface SignatureDoc {
    parameters: SymbolDoc[];
    returnType: string;
}

export interface PropItem extends SymbolDoc {
    type: string;
    tags: Record<string, string>;
    defaultValue?: string;
    required: boolean;
}

export interface ComponentDoc extends SymbolDoc {
    tags: Record<string, string>;
    props: PropItem[];
}

export type SingleOrArray<T> = T | T[];

/** True if this is visible outside this file, false otherwise */
function isNodeExported(node: ts.Node): boolean {
    return (
        // tslint:disable-next-line:no-bitwise
        (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
        (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
}

export class Parser {
    private checker: ts.TypeChecker;

    constructor(program: ts.Program) {
        this.checker = program.getTypeChecker();
    }

    visit = (node: ts.Node): SingleOrArray<ComponentDoc | null> => {
        if (!isNodeExported(node)) return null;

        if (ts.isFunctionDeclaration(node) && node.name) {
            const symbol = this.checker.getSymbolAtLocation(node.name);

            if (symbol) {
                return this.serializeFunctionDeclaration(symbol);
            }

            return null;
        } else if (ts.isClassDeclaration(node) && node.name) {
            const symbol = this.checker.getSymbolAtLocation(node.name);

            if (symbol) {
                return this.serializeClassDeclaration(symbol);
            }

            return null;
        } else if (ts.isVariableStatement(node)) {
            return node.declarationList.declarations.map((declaration) => {
                const symbol = this.checker.getSymbolAtLocation(declaration.name);

                if (symbol) {
                    return this.serializeVariableDeclaration(symbol);
                }

                return null;
            });
        }

        return null;
    };

    getPropsFromStatelessComponent(type: ts.Type): ts.Symbol | null {
        const callSignatures = type.getCallSignatures();

        if (callSignatures.length > 0) {
            for (const sig of callSignatures) {
                const parameters = sig.getParameters();

                if (parameters.length === 0) {
                    continue;
                }

                const propsParam = parameters[0];

                if (propsParam.name === 'props' || parameters.length === 1) {
                    return propsParam;
                }
            }
        }

        return null;
    }

    getPropsFromStateFullComponent(type: ts.Type): ts.Symbol | null {
        const constructSignatures = type.getConstructSignatures();

        if (constructSignatures.length > 0) {
            for (const sig of constructSignatures) {
                const instanceType = sig.getReturnType();
                const props = instanceType.getProperty('props');

                if (props) {
                    return props;
                }
            }
        }

        return null;
    }

    serializeFunctionDeclaration = (symbol: ts.Symbol): ComponentDoc | null => {
        if (!symbol.valueDeclaration) return null;

        const type = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        const callSignatures = type.getCallSignatures();

        if (callSignatures.length === 0) return null;

        const props = this.getPropsFromStatelessComponent(type);

        if (!props) return null;

        return {
            ...this.serializeSymbol(symbol),
            tags: this.getTags(symbol),
            props: this.getPropsInfo(props)
        };
    };

    serializeClassDeclaration = (symbol: ts.Symbol): ComponentDoc | null => {
        if (!symbol.valueDeclaration) return null;

        const type = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        const constructSignatures = type.getConstructSignatures();

        if (constructSignatures.length === 0) return null;

        const props = this.getPropsFromStateFullComponent(type);

        if (!props) return null;

        const symbolDoc = this.serializeSymbol(symbol);

        return {
            ...symbolDoc,
            tags: this.getTags(symbol),
            props: this.getPropsInfo(props)
        };
    };

    serializeVariableDeclaration = (symbol: ts.Symbol): ComponentDoc | null => {
        const type = this.checker.getTypeOfSymbolAtLocation(
            symbol,
            // tslint:disable-next-line:no-non-null-assertion no-unnecessary-type-assertion
            symbol.valueDeclaration || symbol.declarations![0]
        );

        const props =
            this.getPropsFromStatelessComponent(type) || this.getPropsFromStateFullComponent(type);

        if (!props) return null;

        const symbolDoc = this.serializeSymbol(symbol);

        return {
            ...symbolDoc,
            tags: this.getTags(symbol),
            props: this.getPropsInfo(props)
        };
    };

    getPropsInfo(propsObj: ts.Symbol /*, defaultProps: Record<string, string> = {}*/): PropItem[] {
        if (!propsObj.valueDeclaration) {
            return [];
        }

        const propsType = this.checker.getTypeOfSymbolAtLocation(
            propsObj,
            propsObj.valueDeclaration
        );

        const propertiesOfProps = propsType.getProperties();

        const result: PropItem[] = [];

        propertiesOfProps.forEach((prop) => {
            if (!propsObj.valueDeclaration) return;

            // Find type of prop by looking in context of the props object itself.
            const propType = this.checker.getTypeOfSymbolAtLocation(
                prop,
                propsObj.valueDeclaration
            );

            const propTypeString = this.checker.typeToString(propType);

            // tslint:disable-next-line:no-bitwise
            const isOptional = (prop.getFlags() & ts.SymbolFlags.Optional) !== 0;
            const tags = this.getTags(prop);

            let defaultValue: any;

            // if (defaultProps[propName] !== undefined) {
            //     defaultValue = defaultProps[propName];
            // } else
            if (tags.default) {
                defaultValue = tags.default;
                delete tags.default;
            }

            result.push({
                ...this.serializeSymbol(prop),
                type: propTypeString,
                tags: this.getTags(prop),
                defaultValue,
                required: !isOptional
            });
        });

        return result;
    }

    serializeSymbol = (symbol: ts.Symbol): SymbolDoc => {
        return {
            name: symbol.getName(),
            description: ts.displayPartsToString(symbol.getDocumentationComment())
        };
    };

    serializeSignature = (signature: ts.Signature): SignatureDoc => {
        const returnType = signature.getReturnType();

        return {
            parameters: signature.parameters.map(this.serializeSymbol),
            returnType: this.checker.typeToString(returnType)
        };
    };

    getTags = (symbol: ts.Symbol): Record<string, string> => {
        return symbol
            .getJsDocTags()
            .reduce((p, c: ts.JSDocTagInfo) => ({ ...p, [c.name]: c.text || '' }), {});
    };
}

export function parse(
    filePath: string,
    compilerOptions: ts.CompilerOptions = defaultConfig
): ComponentDoc[] {
    const program = ts.createProgram([filePath], compilerOptions);
    const parser = new Parser(program);
    const sourceFile = program.getSourceFile(filePath);

    let output: ComponentDoc[] = [];

    ts.forEachChild(sourceFile, (node) => {
        let doc = parser.visit(node);

        if (!doc) return;

        if (Array.isArray(doc)) {
            doc = doc.filter((c) => c);
            output = [...output, ...(doc as ComponentDoc[])];

            return;
        }

        output = [...output, doc];
    });

    return output;
}
