#!/usr/bin/env node

const Service = require('../lib/service');

const service = new Service();

const rawArgv = process.argv.slice(2);
// eslint-disable-next-line import/order
const args = require('minimist')(rawArgv, {
  boolean: [
    'analyze',
    'open',
    'https',
    'ftp',
  ],
});

const command = args._[0];

service.run(command, args, rawArgv);
