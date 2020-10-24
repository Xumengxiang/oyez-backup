/* eslint-disable import/no-unresolved */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackPluginExternals = require('@xfe/webpack-plugin-externals');
const WebpackPluginPreConnect = require('@xfe/webpack-plugin-preconnect');
const WebpackBar = require('webpackbar');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const {
  ROOT_PATH, DEV_PATH, BUILD_PATH, isTsProject, generateChunks,
} = require('@xfe/oyez-utils');
const { createModule } = require('./module');

function WebpackCommonChainFn(webpackConfig, options, envs) {
  const {
    entryPath, templatePath, externals, alias = {}, prefetch, preload, preconnect, webpackPlugins,
  } = options;
  const entryFile = isTsProject() ? 'index.tsx' : 'index.js';
  const finalEntryFile = entryPath
    ? path.resolve(ROOT_PATH, entryPath) : path.resolve(DEV_PATH, entryFile);
  const defineEnvVariables = {};
  Object.keys(envs).forEach((env) => {
    defineEnvVariables[env] = JSON.stringify(envs[env]);
  });
  const template = templatePath
    ? path.resolve(ROOT_PATH, templatePath) : path.resolve(DEV_PATH, 'templates/index.html');

  webpackConfig
    .entry('main')
    .add('webpack/hot/dev-server')
    .add(finalEntryFile)
    .end()
    .output
    .path(BUILD_PATH)
    .filename('[name].js')
    .chunkFilename('[name].js')
    .publicPath('/')
    .globalObject('this');

  webpackConfig.resolve
    .extensions
    .merge(['.ts', '.tsx', '.js', '.jsx']);

  // set alias
  const finalAlias = { '@': DEV_PATH, ...alias };
  Object.keys(finalAlias).forEach((key) => {
    webpackConfig.resolve
      .alias
      .set(key, finalAlias[key]);
  });

  createModule(webpackConfig, options);

  webpackConfig
    .plugin('HtmlWebpackPlugin')
    .use(HtmlWebpackPlugin, [{
      template,
    }])
    .end()
    .plugin('ContextReplacementPlugin')
    .use(webpack.ContextReplacementPlugin, [/moment[/\\]locale$/, /zh-cn/])
    .end()
    .plugin('DefinePlugin')
    .use(webpack.DefinePlugin, [defineEnvVariables])
    .end()
    .plugin('WebpackBar')
    .use(WebpackBar, [{ name: '🍭  server', color: '#FC5531' }])
    .end();
  if (externals) {
    webpackConfig
      .plugin('WebpackPluginExternals')
      .use(WebpackPluginExternals, [externals]);
  }

  if (prefetch) {
    webpackConfig
      .plugin('PrefetchWebpackPlugin')
      .use(PreloadWebpackPlugin, [{ rel: 'prefetch' }]);
  }

  if (preload) {
    webpackConfig
      .plugin('PreloadWebpackPlugin')
      .use(PreloadWebpackPlugin, [{ rel: 'preload', include: 'initial' }]);
  }

  if (preconnect && Array.isArray(preconnect)) {
    webpackConfig
      .plugin('WebpackPluginPreConnect')
      .use(WebpackPluginPreConnect, [preconnect]);
  }

  if (webpackPlugins && Array.isArray(webpackPlugins)) {
    webpackPlugins.forEach((webpackPlugin, index) => {
      const [plugin, pluginArgs = ''] = webpackPlugin;
      const pluginName = `${plugin.name}-${index}`;

      if (pluginArgs) {
        webpackConfig
          .plugin(pluginName)
          .use(plugin, [pluginArgs]);
      } else {
        webpackConfig
          .plugin(pluginName)
          .use(plugin);
      }
    });
  }

  webpackConfig
    .optimization
    .namedChunks(true)
    .namedModules(true)
    .splitChunks({
      cacheGroups: generateChunks(),
    });
}

exports.WebpackCommonChainFn = WebpackCommonChainFn;
