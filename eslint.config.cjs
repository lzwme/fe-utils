const path = require('path');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
  ...tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          tsconfigRootDir: path.resolve(__dirname),
          project: './tsconfig.eslint.json',
          projectFolderIgnoreList: ['**/node_modules/**', '**/dist/**', '**/dist-admin/**'],
          warnOnUnsupportedTypeScriptVersion: false,
          ecmaFeatures: {
            jsx: true,
          },
          ecmaVersion: 2023,
          sourceType: 'module',
        },
      },
      linterOptions: {
        reportUnusedDisableDirectives: false,
      },
      plugins: {
        prettier: require('eslint-plugin-prettier'),
        unicorn: require('eslint-plugin-unicorn'),
        jest: require('eslint-plugin-jest'),
      },
      ignores: ['**/node_modules/**', 'dist/**', 'cjs/**', 'esm/**', 'docs/**', 'mock/**', '**/*.js', '**/*.d.ts'],
      rules: {
        'prettier/prettier': 'warn',
        indent: ['off', 2],
        'no-console': ['off', { allow: ['warn', 'error'] }],
        'prefer-const': [
          'error',
          {
            destructuring: 'all',
          },
        ],

        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true }],
        // TODO
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/await-thenable': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/prefer-promise-reject-errors': 'off',
        '@typescript-eslint/no-require-imports': 'off',

        'unicorn/no-array-for-each': 'off',
        'unicorn/no-await-expression-member': 'off',
      },
      files: ['src/**/*.ts'],
    },
    {
      files: ['*.js', '*.cjs', '*.mjs'],
      ...tseslint.configs.disableTypeChecked,
    }
  ),
];
