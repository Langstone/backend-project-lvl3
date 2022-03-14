import downloaderImages from './downloader_images.js';
import downloaderPage from './downloader_page.js';
import downloaderFiles from './downloader_files.js';
import Listr from 'listr';

export default function pageLoader(url, output) {
  const tasks = new Listr([
    {
      title: 'Загрузка страницы',
      task: ctx => downloaderPage(ctx.url, ctx.output)
        .then(path => ctx.path = path)
        .catch(err => {
          console.error(`${err.name} ${err.message}`);
        })
    },
    {
      title: 'Загрузка изображений',
      task: ctx => downloaderImages(ctx.url, ctx.path)
        .then(nameForDirectory => ctx.nameForDirectory = nameForDirectory)
        .catch(err => {
          console.error(`${err.name} ${err.message}`);
        })
      },
    {
      title: 'Загрузка остальных ресурсов',
      task: ctx => downloaderFiles(ctx.path, ctx.nameForDirectory, ctx.url)
        .catch(err => {
          console.error(`${err.name} ${err.message}`);
        })
    }
  ]);
  
  tasks.run({
    url: url,
    output: output,
  }).then(ctx => {
    console.log(ctx.path)
  }).catch(err => {
    console.error(`${err.name} ${err.message}`);
    console.log('Что-то пошло не так...')
    process.exit(1);
  });
}