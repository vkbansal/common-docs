const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

function docsConfig({ context, PROD, pathname, pageTitle }) {
    const DEV = !PROD;

    const config = {
        context,
        entry: ['./index.tsx'],
        output: {
            filename: DEV ? 'bundle.js' : 'bundle.[hash].js',
            path: path.resolve(context, '../public'),
            publicPath: DEV ? '/' : `/${pathname}/`,
            hashDigestLength: 6,
            sourceMapFilename: 'bundle.js.map'
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                compilerOptions: {
                                    declaration: false
                                }
                            }
                        }
                    ],
                    include: [
                        path.resolve(context, '../src'),
                        path.resolve(context),
                        path.resolve(__dirname, '../')
                    ]
                },
                {
                    test: /\.css$/,
                    use: 'glamor-loader'
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, '../template.html'),
                inject: true,
                title: pathname,
                filename: 'index.html',
                PROD
            })
        ],
        resolve: {
            extensions: ['.ts', '.tsx', '.js']
        }
    };

    DEV && (config.devtool = 'source-map');

    PROD &&
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify('production')
                }
            }),
            new MinifyPlugin(),
            new CompressionPlugin({
                asset: '[path][query]',
                test: /\.(js|css)$/
            })
        );

    return config;
}

module.exports = docsConfig;
