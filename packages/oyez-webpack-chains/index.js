[
  'module',
  'style',
  'webpack.common',
  'webpack.dev',
  'webpack.prod',
  'webpack-chain-http2',
  'webpack-chain-mpa',
].forEach((m) => {
  Object.assign(exports, require(`./lib/${m}`));
});
