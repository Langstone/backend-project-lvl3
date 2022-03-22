import dirname from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import debug from 'debug';
import pkg from 'axios-debug-log';
import { stat } from 'fs';

function renameFile(element) {
  if (element.match(/\W/)) {
    return '-';
  }
  return element;
};

const logPageLoader = debug('page-loader');

const downloaderPage = ((htmlPath, currentDir = dirname) => {
  return new Promise((resolve, reject) => {
    if (typeof currentDir === 'object') {
      console.log(currentDir.dirname);
    }
    if (currentDir === '/sys' && '/system') {
      reject(err);
    };
    fs.stat(currentDir)
      .then(stats => {
        if (!stats.isDirectory()) {
          reject(new Error(`ENOENT: no such directory ${currentDir}`))
        }
      })
      .catch(err => reject(err));
    logPageLoader(`Отправляем запрос на страницу ${htmlPath}`);
    axios({
      method: 'get',
      url: htmlPath,
    })
      .then(response => {
        const nameForFileWithoutProtocol = htmlPath.slice(8).split('');
        const nameForNewFile = nameForFileWithoutProtocol.map(element => renameFile(element)).join('').concat('.html');
        const pathToFile = currentDir.concat("/" + nameForNewFile);
        logPageLoader(`Запрос на страницу ${htmlPath} прошел успешно, приступаем к загрузке`);
        fs.writeFile(pathToFile, response.data)
          .catch(err => reject(err));
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