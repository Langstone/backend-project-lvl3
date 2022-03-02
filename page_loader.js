#!/usr/bin/env node
import Commander from 'commander';
import downloaderImages from './downloader_images.js';
import downloaderPage from './downloader_page.js';
import downloaderFiles from './downloader_files.js';


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
    const nameForDirectory = await downloaderImages(url, path);
    await downloaderFiles(path, nameForDirectory, url);
  })
  .parse(process.argv);
  