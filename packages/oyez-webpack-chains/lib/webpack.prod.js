/* eslint-disable import/no-unresolved */
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const findFreePort = require('find-free-port-sync');
const { ROOT_PATH, DEV_PATH } = require('@xfe/oyez-utils');
const { setStyleLoaders } = require('./style');

function WebpackProdChainFn(webpackConfig, options) {
  const { NODE_ENV = 'development' } = process.env;
  const {
    analyze, gzip, cdn, root, productionSourceMap, env, devtool, entryPath, cssExtract = {},
  } = options;
  const cssExtractPluginOptions = cssExtract.plugin || {};
  const entryFile = fs.existsSync('tsconfig.json') ? 'index.tsx' : 'index.js';
  const finalEntryFile = entryPath
    ? path.resolve(ROOT_PATH, entryPath) : path.resolve(DEV_PATH, entryFile);
  const productionDevtool = (productionSourceMap && env !== 'production') ? (devtool || 'source-map') : false;
  let publicPath = `/${root ? `${root}/` : ''}`;

  if (cdn) {
    publicPath = `${cdn}${publicPath}`;
  }

  if (NODE_ENV === 'production') {
    webpackConfig.mode('production');

    webpackConfig.devtool(productionDevtool);

    webpackConfig
      .entry('main')
      .clear()
      .add(finalEntryFile);

    webpackConfig
      .output
      .filename('[name].[chunkhash:8].js')
      .chunkFilename('[name].[chunkhash:8].js')
      .publicPath(publicPath);

    webpackConfig
      .plugin('MiniCssExtractPlugin')
      .use(MiniCssExtractPlugin, [{
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[name].[contenthash:8].css',
        ...cssExtractPluginOptions,
      }])
      .end()
      .plugin('HashedModuleIdsPlugin')
      .use(webpack.HashedModuleIdsPlugin)
      .end()
      .plugin('WebpackBar')
      .tap(() => ([{ name: '🍳  webpack build' }]))
      .end()
      .plugin('CleanWebpackPlugin')
      .use(CleanWebpackPlugin);

    setStyleLoaders(
      webpackConfig,
      options,
      true,
      'css',
    );

    setStyleLoaders(
      webpackConfig,
      options,
      true,
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
          },
        ],
      ],
    );
  }

  if (analyze) {
    webpackConfig
      .plugin('BundleAnalyzerPlugin')
      .use(BundleAnalyzerPlugin, [{ analyzerPort: findFreePort() }]);
  }

  if (gzip) {
    webpackConfig
      .plugin('CompressionWebpackPlugin')
      .use(CompressionWebpackPlugin, [{
        test: new RegExp('\\.(js|css)$'), // 压缩 js 与 css
        filename: '[path].gz[query]',
        cache: true,
        algorithm: 'gzip',
        deleteOriginalAssets: false,
        compressionOptions: {
          level: 6,
        },
      }]);
  }
}

exports.WebpackProdChainFn = WebpackProdChainFn;
