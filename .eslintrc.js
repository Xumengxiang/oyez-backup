module.exports = {
  extends: [
    require.resolve('eslint-config-airbnb-base'),
  ],
  rules: {
    'no-console': 'off',
    'global-require': 'off',
    'import/no-dynamic-require': 'off',
  },
};
