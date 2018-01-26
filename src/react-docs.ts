import * as MarkdownIt from 'markdown-it';
import { addLanguage, highlight, getLanguage } from 'illuminate-js';
import { jsx, bash, tsx } from 'illuminate-js/lib/languages';

import { parse, ComponentDoc, PropItem } from './tsReactDocsParser';

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

export function reactDocs(files: string[]): Record<string, ComponentDoc[]> {
    return files.reduce<Record<string, ComponentDoc[]>>((data, file) => {
        const content = parse(file)
            .filter((doc) => !('private' in doc.tags))
            .map<ComponentDoc>((doc) => {
                const { description } = doc;

                return {
                    ...doc,
                    description: md.render(description),
                    props: doc.props.map<PropItem>((prop) => {
                        return {
                            ...prop,
                            description: md.render(prop.description)
                        };
                    }, {})
                };
            });

        return {
            ...data,
            [file]: content
        };
    }, {});
}
