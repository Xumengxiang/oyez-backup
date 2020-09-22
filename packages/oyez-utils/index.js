[
  'config',
  'defaults',
  'logger',
  'paths',
  'port',
  'openBrowser',
  'webpackUtils',
].forEach((m) => {
  Object.assign(exports, require(`./lib/${m}`));
});
