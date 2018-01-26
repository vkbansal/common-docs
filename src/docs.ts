import * as MarkdownIt from 'markdown-it';
import { addLanguage, highlight, getLanguage } from 'illuminate-js';
import { jsx, bash, tsx } from 'illuminate-js/lib/languages';

import { parse, NodeDoc } from './tsDocsParser';

addLanguage('js', jsx);
addLanguage('ts', tsx);
addLanguage('bash', bash);

const md = MarkdownIt({
    html: true,
    highlight(str: string, lang: string) {
        if (lang && getLanguage(lang)) {
            return highlight(str, lang);
        }

        return str;
    }
});

export function docs(files: string[]): Record<string, NodeDoc[]> {
    return files.reduce<Record<string, NodeDoc[]>>((data, file) => {
        const content = parse(file)
            .filter((doc) => !('private' in doc.tags))
            .map<NodeDoc>((doc) => {
                const { description, signature, constructors } = doc;

                return {
                    ...doc,
                    description: md.render(description),
                    signature:
                        signature &&
                        signature.map((sig) => ({
                            ...sig,
                            parameters: sig.parameters.map((param) => ({
                                ...param,
                                description: md.render(param.description)
                            }))
                        })),
                    constructors:
                        constructors &&
                        constructors.map((sig) => ({
                            ...sig,
                            parameters: sig.parameters.map((param) => ({
                                ...param,
                                description: md.render(param.description)
                            }))
                        }))
                };
            });

        return {
            ...data,
            [file]: content
        };
    }, {});
}
