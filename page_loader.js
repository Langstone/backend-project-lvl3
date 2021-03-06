#!/usr/bin/env node
import Commander from 'commander';
import Listr from 'listr';
import downloaderImages from './downloader_images.js';
import downloaderPage from './downloader_page.js';
import downloaderFiles from './downloader_files.js';

const command = new Commander.Command();
command.version('0.0.1');

command
  .description('page loader utility')
  .arguments('<url>')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .action((url) => {
    const options = command.opts();

    const tasks = new Listr([
      {
        title: 'Загрузка страницы',
        task: (ctx) => downloaderPage(ctx.url, ctx.output)
          .then((path) => {
            ctx.path = path;
            return ctx.path;
          }),
      },
      {
        title: 'Загрузка изображений',
        task: (ctx) => downloaderImages(ctx.url, ctx.path)
          .then((nameForDirectory) => {
            ctx.nameForDirectory = nameForDirectory;
            return ctx.nameForDirectory;
          }),
      },
      {
        title: 'Загрузка остальных ресурсов',
        task: (ctx) => downloaderFiles(ctx.path, ctx.nameForDirectory, ctx.url),
      },
    ], {
      renderer: 'verbose',
    });

    tasks.run({
      url,
      output: options.output,
    }).then((ctx) => {
      console.log(ctx.path);
    }).catch((err) => {
      console.error(`${err.name} ${err.message}`);
      process.exit(1);
    });
  })
  .parse(process.argv);
