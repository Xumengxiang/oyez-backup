const path = require('path');
const fs = require('fs');
const { ROOT_PATH, TS_CONFIG_PATH } = require('./paths');

function getType(obj) {
  return Object.prototype.toString
    .call(obj)
    .slice(8, -1)
    .toLowerCase();
}

function getThemeConfig(oyezConfig) {
  let theme = {};

  if (oyezConfig.theme && typeof oyezConfig.theme === 'string') {
    let themeConfigPath = oyezConfig.theme;

    if (themeConfigPath.charAt(0) === '.') {
      themeConfigPath = path.resolve(ROOT_PATH, themeConfigPath);
    }
    theme = require(themeConfigPath);
  } else {
    theme = oyezConfig.theme || {};
  }

  return theme;
}

exports.getOyezConfig = (env = '') => {
  const configPath = path.resolve(process.pwd(), 'oyez.config.js');
  let config = fs.existsSync(configPath) ? require(configPath) : {};
  config.theme = getThemeConfig();

  if (env && getType(config.env) === 'object') {
    if (Object.keys(config.env).includes(env)) {
      config = { ...config, ...config.env[env] };
    }
  }

  return config;
};

exports.hasSideEffects = (moduleName) => {
  const modulePkg = require(`${ROOT_PATH}/node_modules/${moduleName}/package.json`);
  const { sideEffects } = modulePkg;

  if (sideEffects === 'false' || sideEffects === false || Array.isArray(sideEffects)) {
    return false;
  }
  return true;
};

exports.isTsProject = () => fs.existsSync(TS_CONFIG_PATH);

exports.getType = getType;
