import stylistic from '@stylistic/stylelint-plugin';

export default {
    root: true,

    plugins: [stylistic],
    extends: ['stylelint-config-standard'],

    rules: {
        '@stylistic/indentation': 4,
        '@stylistic/string-quotes': 'single',

        'selector-class-pattern': null,
        'property-no-vendor-prefix': null,
        'alpha-value-notation': null,
        'color-hex-length': null,
        'color-function-alias-notation': null
    },

    ignoreFiles: ['**/node_modules/**', '**/src/common/*.css']
};
