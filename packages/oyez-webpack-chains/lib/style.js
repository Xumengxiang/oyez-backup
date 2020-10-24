/* eslint-disable import/no-unresolved */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const px2viewport = require('@xfe/postcss-viewport');

function setStyleLoaders(webpackConfig, options, needExtract = false, styleName, loaders) {
  const { px2vw, loaderOptions = {}, cssExtract = {} } = options;
  const {
    postcssLoader: postcssLoaderOptions = {},
    styleLoader: styleLoaderOptions = {},
  } = loaderOptions;
  const {
    loader: cssExtractLoaderOptions = {},
  } = cssExtract;

  function getPostcssLoaderOptions() {
    const postcssOptions = {
      plugins: [
        autoprefixer,
      ],
    };

    if (px2vw) {
      postcssOptions.plugins.push(px2viewport({
        viewportWidth: px2vw.viewportWidth || 375,
      }));
    }

    if (needExtract) {
      postcssOptions.plugins.push(cssnano);
    }

    return { ...postcssOptions, ...postcssLoaderOptions };
  }

  const styleTestReg = new RegExp(`\\.${styleName}$`);
  const rule = webpackConfig.module.rule(styleName);

  if (!needExtract) {
    rule
      .use('style-loader')
      .loader('style-loader')
      .options(styleLoaderOptions);
  } else {
    rule
      .use('MiniCssExtractPlugin')
      .loader(MiniCssExtractPlugin.loader)
      .options(cssExtractLoaderOptions)
      .end();
  }

  rule
    .test(styleTestReg)
    .use('css-loader')
    .loader('css-loader')
    .end()
    .use('postcss-loader')
    .loader('postcss-loader')
    .options(getPostcssLoaderOptions());

  if (loaders && loaders.length) {
    loaders.forEach((loader) => {
      // eslint-disable-next-line no-shadow
      const [loaderName, loaderOptions = {}] = loader;

      rule
        .use(loaderName)
        .loader(loaderName)
        .options(loaderOptions);
    });
  }
}

exports.setStyleLoaders = setStyleLoaders;
