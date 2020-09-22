#!usr/bin/env/ node

const chalk = require('chalk');
const program = require('commander');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const ora = require('ora');
const {
  log,
  error,
  // eslint-disable-next-line import/no-unresolved
} = require('@xfe/oyez-utils');

const {
  isDangerousToCreateProject,
  initTemplate,
  installDependencies,
  linkGitRepo,
} = require('../utils');

const packageJson = require('../package.json');

const spinner = ora();

async function createApp(projectName) {
  if (isDangerousToCreateProject(projectName)) {
    const { action } = await inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        message: projectName === '.' ? '当前目录中已存在文件，请选择一个操作：' : `项目文件夹 ${chalk.green(projectName)} 已存在，请选择一个操作：`,
        choices: [
          { name: '覆盖（删除原文件）', value: 'overwrite' },
          { name: '合并（保留原文件）', value: 'merge' },
          { name: '取消', value: false },
        ],
      },
    ]);

    if (!action) {
      return false;
    }

    if (action === 'overwrite') {
      spinner.start('正在删除文件');
      try {
        await fs.emptyDir(projectName);
        spinner.succeed('原文件已删除');
      } catch (e) {
        log();
        error(e);
        spinner.stop();
        process.exit(1);
      }
    }
  }

  const config = {
    projectName,
  };

  const { type } = await inquirer.prompt([
    {
      name: 'type',
      type: 'list',
      message: '请选择类型：',
      choices: [
        { name: '项目', value: 'project' },
        { name: '组件', value: 'component' },
        { name: '取消', value: false },
      ],
    },
  ]);

  if (!type) {
    return false;
  }

  // 非项目的type当做template
  config.template = type;

  if (type === 'component') {
    const { template } = await inquirer.prompt([
      {
        name: 'template',
        type: 'list',
        message: '请选择组件模板：',
        choices: [
          { name: 'JS组件库模板', value: 'component' },
          { name: 'TS组件库模板', value: 'component-ts' },
          { name: '取消', value: false },
        ],
      },
    ]);

    if (!template) {
      return false;
    }

    config.template = template;
  }

  if (type === 'project') {
    const { template } = await inquirer.prompt([
      {
        name: 'template',
        type: 'list',
        message: '请选择项目模板：',
        choices: [
          { name: 'PC模板', value: 'pc' },
          { name: 'Mobile模板', value: 'mobile' },
          { name: 'TS模板', value: 'ts' },
          { name: 'SAAS模板', value: 'saas' },
          { name: '多页面模板', value: 'mpa' },
          { name: '取消', value: false },
        ],
      },
    ]);

    if (!template) {
      return false;
    }

    config.template = template;
  }

  const { git } = await inquirer.prompt([
    {
      name: 'git',
      type: 'input',
      message: '请输入git仓库地址（可选）：',
      default: '',
    },
  ]);

  config.git = git;

  // 初始化模板
  await initTemplate(config);

  // 安装依赖
  await installDependencies(config);

  // 关联git仓库
  if (git) {
    await linkGitRepo(config);
  }
  return true;
}

program.version(packageJson.version);

program
  .command('create')
  .arguments('<project-directory>')
  .description('创建一个新项目（「.」表示在当前目录创建）')
  .action((projectName) => {
    createApp(projectName);
  });

program.arguments('<command>').action((cmd) => {
  log();
  log(`  ${chalk.red(`Unknown command ${chalk.yellow(cmd)}.`)}`);
  log(`  Please run ${chalk.cyan('oyez -h')} for more information of usage.`);
});

program.parse(process.argv);
