/* eslint-disable import/no-unresolved */
const path = require('path');
const fs = require('fs-extra');
const cp = require('child_process');
const ora = require('ora');
const readPkg = require('read-pkg');
const writePkg = require('write-pkg');
const stringifyJS = require('javascript-stringify');
const origin = require('remote-origin-url');
const { getType, log, error } = require('@xfe/oyez-utils');
const { TEMPLATE_VERSION, GIT_IGNORES } = require('../configs');

const spinner = ora();

exports.isDangerousToCreateProject = (projectName) => (fs.pathExistsSync(projectName) && projectName !== '.') || (projectName === '.' && fs.readdirSync(projectName).filter((fileName) => !(/^\./.test(fileName))).length);

function installTemplate(projectPath, template) {
  const templateName = typeof template === 'string' ? template : 'default';
  const moduleName = `@xfe/oyez-template-${templateName}`;
  const moduleVersion = TEMPLATE_VERSION[templateName];
  const command = `npm init -y && yarn add ${moduleName}@${moduleVersion}`;

  return new Promise((resolve, reject) => {
    cp.exec(command, { cwd: projectPath, stdio: 'inherit' }, async (err) => {
      if (err) {
        reject(err);
      }

      try {
        // 从node_modules中复制模板到项目路径
        await fs.copy(`${projectPath}/node_modules/${moduleName}`, projectPath);
        // 生成.gitignore
        await fs.outputFile(`${projectPath}/.gitignore`, GIT_IGNORES.join('\n'));
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

exports.initTemplate = async ({
  projectName, git, template,
}) => {
  const projectPath = path.join(process.cwd(), projectName);
  const appName = path.basename(projectPath);

  fs.ensureDirSync(projectName);
  spinner.start('正在创建模板');
  setTimeout(() => {
    spinner.text = '正在创建模板，可能需要花点时间，喝口水吧～～🍵';
  }, 10000);
  setTimeout(() => {
    spinner.text = '正在创建模板，可能需要花点时间，起来泡杯咖啡吧～～☕️';
  }, 30000);

  try {
    await installTemplate(projectPath, template);
  } catch (e) {
    log();
    error(e);
    spinner.stop();
    process.exit(1);
  }

  const pkg = readPkg.sync(projectPath);
  const gitUrl = git || origin.sync;

  pkg.name = appName;
  pkg.version = '0.1.0';

  if (template === 'component') {
    pkg.files = ['es', 'lib', 'src'];
  }

  if (gitUrl) {
    pkg.repository = {
      type: 'git',
      url: gitUrl,
    };
  }

  // eslint-disable-next-line no-underscore-dangle
  delete pkg._id;
  delete pkg.readme;
  writePkg.sync(projectPath, pkg);

  // 组件模板没有oyez.config.js
  if (!['component', 'component-ts'].includes(template)) {
    const appConfig = require(`${projectPath}/oyez.config.js`);
    appConfig.root = appName;

    if (getType(template) === 'object') {
      const { needPx2vw } = template;

      if (needPx2vw) {
        appConfig.px2vw = true;
      }
    }

    fs.outputFileSync(`${projectPath}/oyez-config.js`, `module.exports = ${stringifyJS(appConfig, null, 2)}`);
  }

  spinner.succeed('模板已创建');
};

exports.installDependencies = async ({ projectName, template }) => {
  const projectPath = path.join(process.cwd(), projectName);
  const dependencies = [];

  if (getType(template) === 'object') {
    const { needRematch, needAntd } = template;

    if (needRematch) {
      dependencies.push('@rematch/core');
    }

    if (needAntd) {
      dependencies.push('antd');
    }
  }
  const command = ['yarn'];

  if (dependencies.length > 0) {
    command.push(`yarn add ${dependencies.join(' ')}`);
  }

  log('🏗 开始安装依赖');
  cp.execSync(command.join(' && '), {
    cwd: projectPath,
    stdio: 'inherit',
  });
};

exports.linkGitRepo = async ({ projectName, git }) => {
  const projectPath = path.join(process.cwd(), projectName);
  const command = [
    'git init',
    `git remote add origin ${git}`,
    'git add .',
    'git commit -m "初始化本地项目"',
  ];

  spinner.start('正在关联git仓库');
  cp.exec(command.join(' && '), {
    cwd: projectPath,
    stdio: 'inherit',
  }, (err) => {
    if (err) {
      log();
      error(err);
      spinner.stop();
      process.exit(1);
    }
    spinner.stopAndPersist({
      symbol: '🔗',
      text: '已关联git仓库',
    });
  });
};
