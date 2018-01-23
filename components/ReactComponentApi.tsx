import * as React from 'react';
import glamorous from 'glamorous';
import { ComponentDoc } from 'react-docgen-typescript/lib';
import { Illuminate } from 'react-illuminate';

const Heading = glamorous.h3({
    fontWeight: 'bold',
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

    renderProps = (key: string, i: number) => {
        const prop = this.props.api.props[key];
        const { description } = prop;
        const [desc, example] = description.split('@example');

        return (
            <div key={i}>
                <Heading>
                    {`props.${key}${prop.required ? '' : '?'}: ${prop.type.name.split(' | ')[0]}`}
                    {prop.defaultValue && <>{` (default: ${prop.defaultValue.value})`}</>}
                </Heading>
                <div dangerouslySetInnerHTML={{ __html: desc }} />
                {example && <Illuminate lang={this.props.lang}>{example.trim()}</Illuminate>}
            </div>
        );
    };

    render() {
        return Object.keys(this.props.api.props).map(this.renderProps);
    }
}
