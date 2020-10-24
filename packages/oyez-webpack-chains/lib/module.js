function createModule(webpackConfig, options) {
  const BABEL_EXCLUDE_REG = /node_modules[/\\](?!@xfe)/;
  const { urlLimit = 4096, loaderOptions } = options;
  const {
    threadLoader: threadLoaderOptions = {},
    babelLoader: babelLoaderOptions = {},
    urlLoader: urlLoaderOptions = {},
  } = loaderOptions;

  webpackConfig.module
    .rule('react')
    .test(/\.(js|jsx|ts|tsx)$/)
    .exclude
    .add(BABEL_EXCLUDE_REG)
    .end()
    .use('thread-loader')
    .loader('thread-loader')
    .options(threadLoaderOptions)
    .end()
    .use('babel-loader')
    .loader('babel-loader')
    .options({ cacheDirectory: true, ...babelLoaderOptions });

  webpackConfig.module
    .rule('worker')
    .test(/\.worker\.js$/)
    .use('worker-loader')
    .loader('worker-loader');

  webpackConfig.module
    .rule('image')
    .test(/\.(png|jpe?g|gif|webp)$/)
    .use('image-loader')
    .loader('url-loader')
    .options({
      name: 'assets/images/[hash:8].[name].[ext]',
      limit: urlLimit,
      ...urlLoaderOptions,
    });

  webpackConfig.module
    .rule('font')
    .test(/\.(eot|woff|woff2|ttf|svg|otf)$/)
    .use('font-loader')
    .loader('url-loader')
    .options({
      limit: urlLimit,
    });

  webpackConfig.module
    .rule('media')
    .test(/\.(wav|mp3|mp4)$/)
    .use('media-loader')
    .loader('file-loader');

  webpackConfig.module
    .rule('html')
    .test(/\.html$/)
    .use('html-loader')
    .loader('html-loader');
}

exports.createModule = createModule;
