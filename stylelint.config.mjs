export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['dist/**', 'tmp/**'],
  rules: {
    'alpha-value-notation': null,
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'color-hex-length': null,
    'custom-property-empty-line-before': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'declaration-empty-line-before': null,
    'declaration-property-value-no-unknown': null,
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['color-mix'],
      },
    ],
    'keyframes-name-pattern': null,
    'media-feature-range-notation': null,
    'no-descending-specificity': null,
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['composes'],
      },
    ],
    'rule-empty-line-before': null,
    'selector-class-pattern': null,
    'value-keyword-case': null,
  },
};
