const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const CracoAliasPlugin = require('craco-alias');
const CopyWebpackPlugin = require('copy-webpack-plugin');

require('dotenv').config({
    path: `${fs.realpathSync(__dirname + '/../../../')}/.env`
});

const wpEnv = new webpack.DefinePlugin({
    API_URL_ENV: JSON.stringify(process.env.API_URL_ENV),
    NEW_API_URL_ENV: JSON.stringify(process.env.NEW_API_URL_ENV)
});

module.exports = {
    babel: {
        loaderOptions: (babelLoaderOptions) => {
            const origBabelPresetCRAIndex = babelLoaderOptions.presets.findIndex((preset) => {
                return preset[0].includes('babel-preset-react-app');
            });

            const origBabelPresetCRA = babelLoaderOptions.presets[origBabelPresetCRAIndex];

            babelLoaderOptions.presets[origBabelPresetCRAIndex] = function overridenPresetCRA(api, opts, env) {
                const babelPresetCRAResult = require(origBabelPresetCRA[0])(api, origBabelPresetCRA[1], env);

                babelPresetCRAResult.presets.forEach((preset) => {
                    const isReactPreset =
                        preset && preset[1] && preset[1].runtime === 'automatic' && preset[1].development === true;
                    if (isReactPreset) {
                        preset[1].importSource = '@welldone-software/why-did-you-render';
                    }
                });

                return babelPresetCRAResult;
            };

            return babelLoaderOptions;
        }
    },
    // if you want to track react-redux selectors
    webpack: {
        mode: 'extends',
        plugins: [
            wpEnv,

            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: '../../pwa-ver.txt',
                        to: 'public'
                    }
                ]
            })
        ],
        configure: function (webpackConfig) {
            webpackConfig.module.rules[1].oneOf.unshift({
                test: /\.txt$/i,
                use: [
                    {
                        loader: 'raw-loader',
                        options: {
                            esModule: false
                        }
                    }
                ]
            });
            // https://github.com/facebook/react/issues/20235
            webpackConfig.resolve.alias['react/jsx-runtime'] = require.resolve('react/jsx-runtime');
            webpackConfig.resolve.alias['react/jsx-dev-runtime'] = require.resolve('react/jsx-dev-runtime');

            return webpackConfig;
        }
    },
    eslint: {
        mode: 'file'
    },
    style: {
        postcss: {
            mode: 'file',
            loaderOptions: (postcssLoaderOptions, { env, paths }) => {
                delete postcssLoaderOptions['ident']; // TODO check if fixed in craco
                console.log(postcssLoaderOptions);
                return postcssLoaderOptions;
            }
        }
    },
    plugins: [
        {
            plugin: CracoAliasPlugin,
            options: {
                source: 'options',
                aliases: {
                    '~': path.resolve(__dirname, './src'),
                    'pwa-ver.txt': path.resolve(__dirname, '../../pwa-ver.txt'),
                    'react/jsx-runtime': require.resolve('react/jsx-runtime'),
                    'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime')
                }
            }
        }
    ]
};
