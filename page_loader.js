#!/usr/bin/env node
import Commander from 'commander';
import downlaoderPage from './downloader_page.js';

const command = new Commander.Command();
command.version('0.0.1');

command
  .description('page loader utility')
  .arguments('<htmlPath>')
  .option('-o, --output [dir]', 'output dir', "/Users/pavelbutorin/Projects/backend-project-lvl3")
  .action(htmlPath => {
    const options = command.opts();
    downlaoderPage(`${htmlPath}`, options.output);
  })
  .parse(process.argv);