export default {
    root: true,

    extends: ['stylelint-config-standard'],

    rules: {
        'selector-class-pattern': null,
        'property-no-vendor-prefix': null,
        'alpha-value-notation': null,
        'color-hex-length': null,
        'color-function-alias-notation': null,

        'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }]
    },

    ignoreFiles: [
        '**/node_modules/**',
        '**/src/common/*.css',
        'packages/admin/dist/**',
        'packages/scanner/dist/**',
        'packages/admin/build/**',
        'packages/scanner/build/**'
    ]
};
