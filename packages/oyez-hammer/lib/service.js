/* eslint-disable import/no-unresolved */
/* eslint-disable class-methods-use-this */
const Config = require('webpack-chain');
const {
  getOyezConfig, defaults, ROOT_PATH, antdTheme, error,
} = require('@xfe/oyez-utils');
const {
  WebpackCommonChainFn,
  WebpackDevChainFn,
  WebpackProdChainFn,
  WebpackMpaChainFn,
  WebpackHttp2ChainFn,
} = require('@xfe/oyez-webpack-chains');
const {
  Tapable, AsyncSeriesHook, AsyncSeriesBailHook,
} = require('tapable');
const inspectConfig = require('./inspect');
const { handleTapableError } = require('../utils');

const pkg = require(`${ROOT_PATH}/package.json`);

class Service extends Tapable {
  constructor() {
    super();
    this.hooks = {
      // devServer
      beforeServer: new AsyncSeriesHook(['service']),
      server: new AsyncSeriesBailHook(['service']),

      // runBuild
      beforeBuild: new AsyncSeriesHook('service'),
      build: new AsyncSeriesBailHook(['service']),
      afterBuild: new AsyncSeriesHook(['service']),
      done: new AsyncSeriesHook(['service']),
    };
    this.plugins = [];
    this.webpackChainFns = [];
    this.configs = [];
    this.envs = {};
    this.oyezConfig = {};
  }

  getThemeConfig(theme) {
    let themeConfig = theme || {};

    // antd主题
    if (Object.keys(pkg.dependencies || {}).includes('antd')) {
      themeConfig = { ...antdTheme, ...themeConfig };
    }

    return themeConfig;
  }

  getEnvsAndConfigs(args) {
    const oyezConfig = getOyezConfig(args.env);

    const {
      env = 'development', https, host, port, open,
      root, cdn, analyze, ftp, ftpType, ftpProject, ...otherArgs
    } = args;

    const {
      sentry = '', px2vw = false, proxy = {}, http2, urlLimit = 4096, dll, modern, gzip,
      mpa, theme, productionSourceMap = false, dllExcludes = [], entryPath = '', templatePath = '',
      mpaViewPath = '', mpaControllerPath = '', externals = '', alias = '', devServer = '', devtool = '',
      prefetch, preload, preconnect = '', webpackPlugins = '', loaderOptions, cssExtract, ...otherConfigs
    } = oyezConfig;

    const configs = {
      env,
      https: https || defaults.https,
      host: host || defaults.host,
      analyze: analyze || defaults.analyze,
      port: port || defaults.port,
      root: root || oyezConfig.root,
      cdn: cdn || oyezConfig.cdn || '',
      open,
      sentry,
      px2vw,
      proxy,
      http2: args.http2 || http2,
      urlLimit,
      dll,
      dllExcludes,
      modern,
      gzip,
      mpa,
      theme,
      ftp,
      ftpType,
      ftpProject,
      themeConfig: this.getThemeConfig(theme),
      productionSourceMap,
      entryPath,
      templatePath,
      mpaViewPath,
      mpaControllerPath,
      externals,
      alias,
      devServer,
      devtool,
      prefetch,
      preload,
      webpackPlugins,
      preconnect,
      loaderOptions,
      cssExtract,
      ...otherConfigs,
      ...otherArgs,
    };

    const envs = {
      ENV: env,
      ...otherArgs,
    };

    this.configs = configs;
    this.envs = envs;
    this.args = args;
    this.oyezConfig = oyezConfig;
  }

  resolveBuiltInWebpackChains() {
    const { http2, mpa } = this.configs;
    const builtInWebpackChains = [
      WebpackCommonChainFn, WebpackDevChainFn, WebpackProdChainFn,
    ];
    if (http2) {
      builtInWebpackChains.push(WebpackHttp2ChainFn);
    }

    if (mpa) {
      builtInWebpackChains.push(WebpackMpaChainFn);
    }

    this.webpackChainFns = builtInWebpackChains;
  }

  chainWebpack(fn) {
    this.webpackChainFns.push(fn);
  }

  resolveChainableWebpackConfig() {
    const chainableConfig = new Config();
    const { chainWebpack = '' } = this.oyezConfig;

    if (chainWebpack && typeof chainWebpack === 'function') {
      this.chainWebpack(chainWebpack);
    }

    this.webpackChainFns.forEach((fn) => fn(chainableConfig, this.configs, this.envs));
    return chainableConfig;
  }

  resolveWebpackConfig(chainableConfig = this.resolveChainableWebpackConfig()) {
    return chainableConfig.toConfig();
  }

  resolvePlugins() {
    const { plugins = [] } = this.oyezConfig;
    const builtInPlugins = [
      '@xfe/oyez-plugin-webpack',
    ].map((pluginPath) => {
      const BuiltInPlugin = require(pluginPath);
      return new BuiltInPlugin();
    });

    const optionalBuiltInPlugins = {
      dll: '@xfe/oyez-plugin-dll',
      modern: '@xfe/oyez-plugin-modern',
      ftp: '@xfe/oyez-plugin-ftp',
    };

    Object.keys(optionalBuiltInPlugins).forEach((key) => {
      if (this.configs[key]) {
        const Plugin = require(optionalBuiltInPlugins[key]);
        builtInPlugins.push(new Plugin());
      }
    });

    this.plugins = [
      ...plugins.filter((plugin) => plugin.apply && (typeof plugin.apply === 'function')),
      ...builtInPlugins,
    ];
  }

  registerPlugins() {
    const oyezAPI = this;
    this.plugins.forEach((plugin) => {
      plugin.apply(oyezAPI);
    });
  }

  server() {
    const service = this;
    this.hooks.beforeServer.callAsync(service, (err) => {
      handleTapableError(err);

      this.hooks.server.callAsync(service, () => {});
    });
  }

  build() {
    const service = this;
    this.hooks.beforeBuild.callAsync(service, (err) => {
      handleTapableError(err);

      this.hooks.build.callAsync(service, () => {
        this.hooks.afterBuild(service, (afterBuildErr) => {
          handleTapableError(afterBuildErr);

          this.hooks.done.callAsync(service, (doneErr) => {
            handleTapableError(doneErr);
          });
        });
      });
    });
  }

  run(command, args) {
    const { beforePluginRegister = '' } = this.oyezConfig;

    const service = this;
    this.getEnvsAndConfigs(args);
    this.resolveBuiltInWebpackChains();
    this.resolvePlugins();

    // 用来改变plugin的顺序
    if (typeof beforePluginRegister === 'function') {
      this.plugins = beforePluginRegister(this.plugins);
    }

    this.registerPlugins();

    switch (command) {
      case 'serve':
        process.env.NODE_ENV = 'development';
        this.server();
        break;
      case 'build':
        process.env.NODE_ENV = 'production';
        this.build();
        break;
      case 'inspect':
        inspectConfig(service);
        break;

      default:
        error('no command');
    }
  }
}

module.exports = Service;
