const path = require('path');

const DEV = process.env.NODE_ENV !== 'production';

module.exports = {
    syntax: 'postcss-scss',
    parser: 'postcss-scss',
    plugins: {
        'postcss-clamp': {},
        autoprefixer: {
            flexbox: true,
            grid: 'no-autoplace',
            overrideBrowserslist: ['ie >= 11', 'last 2 versions']
        },
        'postcss-import': {
            path: [path.resolve(__dirname, 'node_modules'), 'src'],
            plugins: []
        },
        'postcss-nested': {},
        'postcss-media-minmax': {}
    }
};
