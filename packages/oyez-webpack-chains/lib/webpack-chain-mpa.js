/* eslint-disable import/no-unresolved */
const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { MPA_VIEW_PATH, MPA_CONTROLLER_PATH, error } = require('@xfe/oyez-utils');

function getFileNameListBySuffix(dirPath, suffix) {
  const files = fs.readdirSync(dirPath);
  const list = [];

  files.forEach((fileName) => {
    const fullName = path.join(dirPath, fileName);
    const stats = fs.statSync(fullName);
    if (stats.isFile() && fileName.includes(suffix)) {
      list.push(fileName.split(suffix)[0]);
    }
  });

  return list;
}

function getMpaEntry(url, options) {
  const { mpaViewPath, mpaControllerPath } = options;
  const htmlNameList = getFileNameListBySuffix(mpaViewPath || MPA_VIEW_PATH, '.html');
  const controllerNameList = getFileNameListBySuffix(MPA_CONTROLLER_PATH, '.js');

  const matchFlag = htmlNameList.every((htmlName) => controllerNameList.includes(htmlName));

  if (!matchFlag) {
    error('view中的每个html文件都需要在controller文件中有同名的js文件');
    process.exit(1);
  }

  const devEntryObject = {};
  const prodEntryObject = {};

  controllerNameList.forEach((item) => {
    devEntryObject[item] = [
      path.resolve(mpaControllerPath || MPA_CONTROLLER_PATH, `${item}.js`),
      'webpack/hot/dev-server',
      `webpack-dev-server/client?${url}`,
    ];
    prodEntryObject[item] = [
      path.resolve(MPA_CONTROLLER_PATH, `${item}.js`),
    ];
  });

  return {
    htmlNameList,
    entry: controllerNameList.map((item) => path.resolve(MPA_CONTROLLER_PATH, `${item}.js`)),
    devEntryObject,
    prodEntryObject,
  };
}

function WebpackMpaChainFn(webpackConfig, options) {
  const { NODE_ENV = 'development' } = process.env;
  const { https, host, port } = options;
  const url = `http${https ? 's' : ''}://${host}:${port}`;
  const { htmlNameList, devEntryObject, prodEntryObject } = getMpaEntry(url, options);

  // 清空默认的入口
  webpackConfig.entryPoints.clear();

  // 删除默认的HtmlWebpackPlugin
  webpackConfig.plugins.delete('HtmlWebpackPlugin');

  htmlNameList.forEach((name) => {
    webpackConfig
      .plugin(`HtmlWebpackPlugin_${name}`)
      .use(HtmlWebpackPlugin, [{
        template: path.resolve(MPA_VIEW_PATH, `${name}.html`),
        fileName: `${name}.html`,
        chunks: [name],
      }]);
  });

  if (NODE_ENV === 'development') {
    webpackConfig.merge({ entry: devEntryObject });
  } else {
    webpackConfig.merge({ entry: prodEntryObject });
  }
}

exports.WebpackMpaChainFn = WebpackMpaChainFn;
