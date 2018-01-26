import * as React from 'react';
import glamorous from 'glamorous';
import { ComponentDoc, PropItem } from '../tsReactDocsParser';
import { Illuminate } from 'react-illuminate';

const Code = glamorous.code({
    color: '#e94949'
});

export interface ReactComponentApiProps {
    api: ComponentDoc;
    lang: string;
}

export class ReactComponentApi extends React.Component<ReactComponentApiProps> {
    shouldComponentUpdate() {
        return false;
    }

    renderProps = (prop: PropItem, i: number) => {
        const { description, name, tags } = prop;
        const { example } = tags;

        return (
            <div key={i}>
                <h3>
                    <Code>
                        {`props.${name}${prop.required ? '' : '?'}: ${prop.type.split(' | ')[0]}`}
                        {prop.defaultValue && <>{` (default: ${prop.defaultValue})`}</>}
                    </Code>
                </h3>
                <div dangerouslySetInnerHTML={{ __html: description }} />
                {example && <Illuminate lang={this.props.lang}>{example.trim()}</Illuminate>}
            </div>
        );
    };

    render() {
        const { api, lang } = this.props;

        return (
            <div>
                <h2>
                    <Code>{`<${api.name} {...props} />`}</Code>
                </h2>
                {api.tags.example && <Illuminate lang={lang}>{api.tags.example}</Illuminate>}
                {api.props.map(this.renderProps)}
            </div>
        );
    }
}
