#!/usr/bin/env node
import Commander from 'commander';
import downloaderFile from './old/downloader_file2.js';
import downloaderPage from './downloader_page.js';


const command = new Commander.Command();
command.version('0.0.1');

command
  .description('page loader utility')
  .arguments('<url>')
  .option('-o, --output [dir]', 'output dir', "/Users/pavelbutorin/Projects/backend-project-lvl3")
  .action(async url => {
    const options = command.opts();    
    const path = await downloaderPage(`${url}`, options.output);
    console.log(path);
    await downloaderFile(url, path);
  })
  .parse(process.argv);
  