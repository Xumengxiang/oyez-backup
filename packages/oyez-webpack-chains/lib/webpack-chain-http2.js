/* eslint-disable import/no-unresolved */
const { generateChunksForHttp2 } = require('@xfe/oyez-utils');

function WebpackHttp2ChainFn(webpackConfig) {
  webpackConfig
    .optimization
    .splitChunks(generateChunksForHttp2());
}

exports.WebpackHttp2ChainFn = WebpackHttp2ChainFn;
