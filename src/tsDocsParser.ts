import * as ts from 'typescript';

const defaultConfig: ts.CompilerOptions = {
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.Latest,
    jsx: ts.JsxEmit.React
};

export interface SymbolDoc {
    name: string;
    type: string;
    description: string;
}

export interface SignatureDoc {
    parameters: SymbolDoc[];
    returnType: string;
}

export interface NodeDoc extends SymbolDoc {
    constructors?: SignatureDoc[];
    tags: Record<string, string>;
    signature?: SignatureDoc[];
}

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

    visit = (node: ts.Node): NodeDoc | null => {
        if (!isNodeExported(node)) return null;

        if (ts.isFunctionDeclaration(node) && node.name) {
            const symbol = this.checker.getSymbolAtLocation(node.name);

            if (symbol) {
                return this.serializeFunctionDeclaration(symbol);
            }

            return null;
        } else if (ts.isFunctionExpression(node) && node.name) {
            const symbol = this.checker.getSymbolAtLocation(node.name);

            if (symbol) {
                // TODO: fix this
                return this.serializeFunctionDeclaration(symbol);
            }

            return null;
        } else if (ts.isClassDeclaration(node) && node.name) {
            const symbol = this.checker.getSymbolAtLocation(node.name);

            if (symbol) {
                return this.serializeClassDeclaration(symbol);
            }

            return null;
        }

        return null;
    };

    serializeFunctionDeclaration = (symbol: ts.Symbol): NodeDoc => {
        // tslint:disable-next-line:no-non-null-assertion
        const type = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);

        return {
            ...this.serializeSymbol(symbol),
            tags: symbol
                .getJsDocTags()
                .reduce<Record<string, string>>((p, c) => ({ ...p, [c.name]: c.text || '' }), {}),
            signature: type.getCallSignatures().map(this.serializeSignature)
        };
    };

    serializeClassDeclaration = (symbol: ts.Symbol): NodeDoc => {
        // tslint:disable-next-line:no-non-null-assertion
        const type = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);

        return {
            ...this.serializeSymbol(symbol),
            type: 'Class',
            tags: symbol
                .getJsDocTags()
                .reduce<Record<string, string>>((p, c) => ({ ...p, [c.name]: c.text || '' }), {}),
            constructors: type.getConstructSignatures().map(this.serializeSignature)
        };
    };

    serializeSymbol = (symbol: ts.Symbol): SymbolDoc => {
        return {
            name: symbol.getName(),
            type: this.checker.typeToString(
                // tslint:disable-next-line:no-non-null-assertion
                this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
            ),
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
}

export function parse(
    filePath: string,
    compilerOptions: ts.CompilerOptions = defaultConfig
): NodeDoc[] {
    const program = ts.createProgram([filePath], compilerOptions);
    const parser = new Parser(program);
    const sourceFile = program.getSourceFile(filePath);

    let output: NodeDoc[] = [];

    ts.forEachChild(sourceFile, (node) => {
        const doc = parser.visit(node);

        if (doc) output.push(doc);
    });

    output = output.filter((c) => c);

    return output;
}
