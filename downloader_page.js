import dirname from 'path';
import { writeFile } from 'fs/promises';
import axios from 'axios';
import debug from 'debug';
// import { log } from 'axios-debug-log';

function renameFile(element) {
  if (element.match(/\W/)) {
    return '-';
  }
  return element;
};

const logPageLoader = debug('page-loader');

const downloaderPage = ((htmlPath, currentDir = dirname) => {
  return new Promise((resolve, reject) => {
    logPageLoader(`Отправляем запрос на страницу ${htmlPath}`);
    axios({
      method: 'get',
      url: htmlPath,
    })
    .then(async response => {
      const nameForFileWithoutProtocol = htmlPath.slice(8).split('');
      const nameForNewFile = nameForFileWithoutProtocol.map(element => renameFile(element)).join('').concat('.html');
      const pathToFile = currentDir.concat( "/" + nameForNewFile);
      logPageLoader(`Запрос на страницу ${htmlPath} прошел успешно, приступаем к загрузке`);
      await writeFile(pathToFile, response.data);
      logPageLoader(`Загрузка страницы ${htmlPath} завершена`);
      resolve(pathToFile);
    })
    .catch((err) => {
      logPageLoader(`Перейти по ссылке ${htmlPath} не получилось`);
      reject(err);
    });
  })
});
export default downloaderPage;