const { loaderByName, removeLoaders } = require('@craco/craco');

module.exports = {
    overrideWebpackConfig: ({ webpackConfig }) => {
        removeLoaders(webpackConfig, loaderByName('raw-loader'));

        webpackConfig.module.rules.unshift({
            test: /\.txt$/i,
            type: 'asset/source'
        });

        return webpackConfig;
    }
};
