/* eslint-disable import/no-unresolved */
const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const { ROOT_PATH, DEV_PATH } = require('@xfe/oyez-utils');
const { setStyleLoaders } = require('./style');

const pkg = require(`${ROOT_PATH}/package.json`);

function WebpackDevChainFn(webpackConfig, options) {
  const { NODE_ENV = 'development' } = process.env;
  const {
    https, host, port, devtool, loaderOptions = {},
  } = options;
  const { cssLoader, lessLoader } = loaderOptions;
  const url = `http${https ? 's' : ''}://${host}:${port}`;

  function supportReactHotReload() {
    const dependencyFlag = Object.keys(pkg.dependencies || {}).includes('react-hot-loader');
    const devDependencyFlag = Object.keys(pkg.devDependencies || {}).includes('react-hot-loader');

    return dependencyFlag || devDependencyFlag;
  }

  if (NODE_ENV === 'development') {
    webpackConfig.mode('development');

    webpackConfig
      .entry('main')
      .prepend(`webpack-dev-server/client?${url}`);

    if (supportReactHotReload()) {
      webpackConfig
        .entry('main')
        .prepend('react-hot-loader/patch');
    }

    webpackConfig.devtool(devtool || 'eval-source-map');

    setStyleLoaders(
      webpackConfig,
      options,
      false,
      'css',
      [
        [
          'css-loader',
          cssLoader,
        ],
      ],
    );

    setStyleLoaders(
      webpackConfig,
      options,
      false,
      'less',
      [
        [
          'less-loader',
          {
            paths: [
              path.resolve(ROOT_PATH, 'node_modules'),
              DEV_PATH,
            ],
            javascriptEnabled: true,
            modifyVars: options.themeConfig,
            ...lessLoader,
          },
        ],
      ],
    );

    webpackConfig
      .plugin('HotModuleReplacementPlugin')
      .use(webpack.HotModuleReplacementPlugin)
      .end()
      .plugin('FriendlyErrorsWebpackPlugin')
      .use(FriendlyErrorsWebpackPlugin, [{ clearConsole: false }]);
  }
}

exports.WebpackDevChainFn = WebpackDevChainFn;
