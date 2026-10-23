// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const stylistic = require('@stylistic/eslint-plugin');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: { '@stylistic': stylistic },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      // Signal inputs/outputs carry the `$` prefix and are aliased to their public name (`$gif` → `gif`).
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/no-output-rename': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Object literals with two or more properties are expanded. Prettier then puts every property on
      // its own line and keeps the object expanded (objectWrap: "preserve"), so the two tools agree.
      '@stylistic/object-curly-newline': [
        'error',
        {
          ObjectExpression: { minProperties: 2, multiline: true, consistent: true },
          ObjectPattern: { consistent: true },
          ImportDeclaration: { consistent: true },
          ExportDeclaration: { consistent: true },
          TSTypeLiteral: { consistent: true },
          TSInterfaceBody: { consistent: true },
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },
]);
