import * as MarkdownIt from 'markdown-it';
import { addLanguage, highlight, getLanguage } from 'illuminate-js';
import { jsx, bash, tsx } from 'illuminate-js/lib/languages';
import * as _ from 'lodash';

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

export type ComponentDocMap = Record<string, ComponentDoc>;

export function propDFS(data: ComponentDocMap, borrows: string, name: string): Partial<PropItem> {
    const arr = borrows.split(',');
    const n = arr.length;

    for (let i = 0; i < n; i++) {
        const borrow = arr[i];
        const comp = data[borrow];

        if (!comp) {
            continue;
        }

        const prop = comp.props.find((p) => p.name === name);

        if (prop && prop.description && !('ignore' in prop.tags)) {
            return prop;
        }

        if (comp.tags.borrows) {
            const borrowedProp = propDFS(data, comp.tags.borrows, name);

            if (borrowedProp.description) return borrowedProp;
        }
    }

    return {};
}

export function reactDocs(files: string[]): ComponentDocMap {
    return _.chain(files)
        .map((file) => parse(file))
        .flatten()
        .filter((doc) => !('private' in doc.tags))
        .map((doc) => {
            const { description, props } = doc;

            return {
                ...doc,
                description: md.render(description),
                props: props.map((prop) => ({
                    ...prop,
                    description: md.render(prop.description)
                }))
            };
        })
        .keyBy((doc) => doc.name)
        .value();
}
