import cheerio from 'cheerio';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import { URL } from 'url';
import debug from 'debug';

function changeElement(element) {
  if (element.match(/\W/)) {
    return '-';
  }
  return element;
}

const logPageLoader = debug('page-loader');

const filtredFilesListFromLink = (url, filepath, tag) => {
  const myURL = new URL(url);
  const hostURL = myURL.host;
  const originURL = myURL.origin;
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf-8')
      .then((response) => {
        let linkList;
        const doc = cheerio.load(response);
        if (tag === 'link') {
          logPageLoader('Заходим в формирование листа ссылок с тегом "link"');
          linkList = doc('link').get()
            .map((el) => el.attribs.href)
            .filter((el) => el !== undefined)
            .map((el) => el.startsWith('/') ? `${originURL}${el}` : el)
            .filter((el) => new URL(el).host === hostURL)
          resolve(linkList);
        }
        if (tag === 'script') {
          logPageLoader('Заходим в формирование листа ссылок с тегом "script"');
          linkList = doc('script').get()
            .map((el) => el.attribs.src)
            .filter((el) => el !== undefined)
            .map((el) => (el.startsWith('/') ? `${originURL}${el}` : el))
            .filter((el) => new URL(el).host === hostURL)
          resolve(linkList);
        }
      })
      .catch((err) => reject(err));
  });
};

const writeFile = (nameForDir, pathsList, url) => {
  const myURL = new URL(url);
  const hostUrl = myURL.host;
  const list = pathsList.filter((el) => el !== undefined);
  return list.map((src) => {
    const srcURL = new URL(src);
    const pathnameSrcURL = srcURL.pathname;
    const directoryNameFromSrcURL = (el) => (path.parse(el).dir === '/' ? path.parse(el).dir : `${path.parse(el).dir}/`);
    const nameFromSrcURL = path.parse(pathnameSrcURL).name;
    return new Promise((resolve, reject) => {
      logPageLoader(`Приступаем к скачиванию файла ${src}`);
      axios({
        method: 'get',
        url: src,
      })
        .then((answerFiles) => {
          logPageLoader(`Получен ответ от ${src}`);
          const form = (htmlPath) => (path.parse(htmlPath).ext === '' ? '.html' : path.parse(htmlPath).ext);
          const format = form(src);
          const nameForFileWithoutProtocolAndExt = `${hostUrl}${directoryNameFromSrcURL(pathnameSrcURL)}${nameFromSrcURL}`;
          const fullSrc = (fp) => (path.parse(fp).ext === '' ? `${fp}.html` : fp);
          const nameForFileWithoutProtocol = nameForFileWithoutProtocolAndExt.split('');
          const nameForNewFile = nameForFileWithoutProtocol
            .map((element) => changeElement(element))
            .join('')
            .concat(format);
          const pathToFile = nameForDir.concat(`/${nameForNewFile}`);
          if (format === '.css') {
            fs.writeFile(pathToFile, `\ufeff${answerFiles.data}`)
              .then(() => {
                logPageLoader(`Скачивание файла ${src} завершено`);
                logPageLoader(`Файл ${src} находится в: ${pathToFile}`);
                resolve({ after: `${path.basename(nameForDir)}/${nameForNewFile}`, before: fullSrc(src) });
              })
              .catch((err) => reject(err));
          } else {
            fs.writeFile(pathToFile, answerFiles.data)
              .then(() => {
                logPageLoader(`Скачивание файла ${src} завершено`);
                logPageLoader(`Файл ${src} находится в: ${pathToFile}`);
                resolve({ after: `${path.basename(nameForDir)}/${nameForNewFile}`, before: fullSrc(src) });
              })
              .catch((err) => reject(err));
          }
        })
        .catch((err) => reject(err));
    });
  });
};

const changePathsInFileFromLink = (filepath, filesPaths, url, tag) => {
  const myURL = new URL(url);
  const hostURL = myURL.host;
  const originURL = myURL.origin;

  return new Promise((resolve, reject) => {
    if (filesPaths.length === 0) {
      resolve();
    }
    fs.readFile(filepath, 'utf-8')
      .then((response) => {
        const doc = cheerio.load(response);
        if (tag === 'link') {
          logPageLoader('Заходим в блок изменения ссылок с тегом "link"');
          doc('link').get()
            .filter((el) => el.attribs.href !== undefined)
            .filter((el) => (el.attribs.href.startsWith('/') ? el.attribs.href = `${originURL}${el.attribs.href}` : el))
            .filter((el) => new URL(el.attribs.href).host === hostURL)
            .filter((el) => (path.parse(el.attribs.href).ext === '' ? el.attribs.href = `${el.attribs.href}.html` : el.attribs.href))
            .map((link) => {
              const before = doc(link).attr('href');
              const found = filesPaths.find((ip) => ip.before === before);
              const { after } = found;
              doc(link).attr('href', after);
              return fs.writeFile(filepath, doc.html())
                .then(() => {
                  logPageLoader('Ссылки с тегом "link" изменены');
                  resolve();
                })
                .catch((err) => reject(err));
            });
        }
        if (tag === 'script') {
          logPageLoader('Заходим в блок изменения ссылок с тегом "script"');
          doc('script').get()
            .filter((el) => el.attribs.src !== undefined)
            .filter((el) => (el.attribs.src.startsWith('/') ? el.attribs.src = `${originURL}${el.attribs.src}` : el.attribs.src))
            .filter((el) => new URL(el.attribs.src).host === hostURL)
            .filter((el) => (path.parse(el.attribs.src).ext === '' ? el.attribs.src = `${el.attribs.src}.html` : `${el.attribs.src}`))
            .map((link) => {
              const before = doc(link).attr('src');
              const found = filesPaths.find((ip) => ip.before === before);
              const { after } = found;
              doc(link).attr('src', after);
              return fs.writeFile(filepath, doc.html())
                .then(() => {
                  logPageLoader('Ссылки с тегом "script" изменены');
                  resolve();
                })
                .catch((err) => reject(err));
            });
        }
      })
      .catch((err) => reject(err));
  });
};

const downloaderFiles = (filepath, nameForDirectory, url) => {
  return new Promise((resolve, reject) => {
    filtredFilesListFromLink(url, filepath, 'link')
      .then((linkList) => {
        const requestPromises = writeFile(nameForDirectory, linkList, url);
        return Promise.all(requestPromises);
      })
      .then((filesPaths) => changePathsInFileFromLink(filepath, filesPaths, url, 'link'))
      .then(() => filtredFilesListFromLink(url, filepath, 'script'))
      .then((pathsList) => {
        const requestPromises = writeFile(nameForDirectory, pathsList, url);
        return Promise.all(requestPromises);
      })
      .then((filesPaths) => changePathsInFileFromLink(filepath, filesPaths, url, 'script'))
      .then(() => resolve())
      .catch((err) => reject(err));
  });
};
export default downloaderFiles;
