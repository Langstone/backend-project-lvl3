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
  .action(url => {
    const options = command.opts();    
    downloaderPage(`${url}`, options.output)
      .then((path) => {
        console.log(path);
        downloaderImages(url, path)
      })  
      .then(nameForDirectory => downloaderFiles(path, nameForDirectory, url))
      .catch(err => {
        console.error(`${err.name} ${err.message}`);
        process.exit(1);
      });
  })
  .parse(process.argv);

  