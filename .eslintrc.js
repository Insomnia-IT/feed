// 'react/jsx-props-no-spreading': 1,
module.exports = {
    plugins: ['import', 'sort-destructure-keys', 'tree-shaking', 'filename-rules', 'folders', '@typescript-eslint'],
    extends: [
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:prettier/recommended',
        'prettier',
        'plugin:react/recommended',
        'plugin:import/errors',
        'plugin:import/warnings'
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
            legacyDecorators: true
        },
        project: './tsconfig.eslint.json'
    },
    rules: {
        'folders/match-regex': [2, '[a-z][a-z-.]*[a-z]$'],
        'filename-rules/match': [
            2,
            {
                '.js': 'kebab-case',
                '.tsx': /^((?!(index.tsx))[_\[\]0-9a-z][\[\]0-9a-z-.]*[a-z])$/
            }
        ],
        'no-bitwise': 1,
        'react/prop-types': 0,
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',
        'tree-shaking/no-side-effects-in-initialization': 0,
        '@typescript-eslint/array-type': [1, { default: 'generic' }],
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-empty-interface': 1,
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 0,
        '@typescript-eslint/no-unsafe-member-access': 0,
        '@typescript-eslint/no-for-in-array': 0,
        '@typescript-eslint/no-unsafe-call': 0,
        '@typescript-eslint/no-unsafe-return': 0,
        '@typescript-eslint/restrict-plus-operands': 0,
        '@typescript-eslint/restrict-template-expressions': 0,
        '@typescript-eslint/prefer-regexp-exec': 0,
        '@typescript-eslint/no-unsafe-argument': 0,
        '@typescript-eslint/no-misused-promises': 0,
        '@typescript-eslint/explicit-function-return-type': [
            1,
            {
                allowExpressions: true
            }
        ],
        '@typescript-eslint/camelcase': 0,
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'enum',
                format: ['StrictPascalCase']
            }
        ],
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_'
            }
        ],
        '@typescript-eslint/member-ordering': [
            'warn',
            {
                default: {
                    order: 'alphabetically',
                    memberTypes: [
                        'public-static-field',
                        'public-instance-field',
                        'public-constructor',
                        'private-static-field',
                        'private-instance-field',
                        'private-constructor',
                        'public-instance-method',
                        'protected-instance-method',
                        'private-instance-method'
                    ]
                }
            }
        ],
        'import/no-default-export': 1,
        'import/no-unresolved': 0,
        'no-restricted-imports': [
            'warn',
            {
                patterns: ['../..*']
            }
        ],
        '@typescript-eslint/consistent-type-exports': 1,
        '@typescript-eslint/consistent-type-imports': [
            1,
            {
                prefer: 'type-imports',
                disallowTypeAnnotations: true
            }
        ],
        'import/named': 0,
        'import/order': [
            1,
            {
                groups: [['builtin', 'external'], 'internal', 'parent', 'sibling'],
                'newlines-between': 'always'
            }
        ],
        'no-sequences': [
            'off',
            {
                allowInParentheses: true
            }
        ],
        'no-restricted-syntax': ['off', 'SequenceExpression'],
        'no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_'
            }
        ],
        'sort-imports': [
            'off',
            {
                ignoreCase: true,
                ignoreDeclarationSort: false,
                ignoreMemberSort: false,
                memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
                allowSeparatedGroups: true
            }
        ],
        'sort-destructure-keys/sort-destructure-keys': [
            2,
            {
                caseSensitive: false
            }
        ]
    },
    settings: {
        react: {
            version: 'detect'
        },
        'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
        'import/internal-regex': '^~/*',
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        },
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                moduleDirectory: ['node_modules', 'src']
            },
            typescript: {
                alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
                project: ['tsconfig.json']
            }
        },
        'react/jsx-sort-props': [
            'error',
            {
                multiline: 'last',
                callbacksLast: true,
                shorthandFirst: true,
                shorthandLast: false,
                ignoreCase: false,
                noSortAlphabetically: false,
                reservedFirst: true
            }
        ],
        'react/jsx-sort-default-props': [
            'error',
            {
                ignoreCase: true
            }
        ],
        'prefer-destructuring': [
            'error',
            {
                VariableDeclarator: {
                    array: true,
                    object: true
                },
                AssignmentExpression: {
                    array: true,
                    object: true
                }
            },
            {
                enforceForRenamedProperties: true
            }
        ],
        'max-depth': [
            'error',
            {
                max: 3
            }
        ],
        complexity: [
            'error',
            {
                max: 3
            }
        ],
        'max-params': [
            'error',
            {
                max: 5
            }
        ],
        'max-nested-callbacks': [
            'error',
            {
                max: 2
            }
        ],
        'max-lines-per-function': [
            'error',
            {
                max: 50,
                IIFEs: true
            }
        ],
        'valid-typeof': [
            'error',
            {
                requireStringLiterals: true
            }
        ]
    }
};
