import fs from 'fs/promises';
import axios from 'axios';
import debug from 'debug';
import { URL } from 'url';

function renameFile(element) {
  if (element.match(/\W/)) {
    return '-';
  }
  return element;
}

const logPageLoader = debug('page-loader');

const downloaderPage = (htmlPath, currentDir = process.cwd()) => 
  new Promise((resolve, reject) => {
    if (currentDir === '/sys' && '/system') {
      reject(new Error(`${currentDir} is system directory`));
    }
    fs.stat(currentDir)
      .then((stats) => {
        if (!stats.isDirectory()) {
          reject(new Error(`ENOENT: no such directory ${currentDir}`));
        }
      })
      .catch((err) => reject(err));
    logPageLoader(`Отправляем запрос на страницу ${htmlPath}`);
    axios({
      method: 'get',
      url: htmlPath,
    })
      .then((response) => {
        const urlHtmlPath = new URL(htmlPath);
        const nameForFileWithoutProtocol = htmlPath.replace(urlHtmlPath.protocol, '').replace('//', '').split('');
        const nameForNewFile = nameForFileWithoutProtocol.map((element) => renameFile(element)).join('').concat('.html');
        const pathToFile = currentDir.concat(`/${nameForNewFile}`);
        logPageLoader(`Запрос на страницу ${htmlPath} прошел успешно, приступаем к загрузке`);
        fs.writeFile(pathToFile, response.data)
          .then(() => {
            logPageLoader(`Загрузка страницы ${htmlPath} завершена`);
            resolve(pathToFile);
          })
          .catch((err) => reject(err));
      })
      .catch((err) => {
        logPageLoader(`Перейти по ссылке ${htmlPath} не получилось`);
        reject(err);
      });
  });

export default downloaderPage;
