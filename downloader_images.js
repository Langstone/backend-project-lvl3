import cheerio from 'cheerio';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import { URL } from 'url';
import debug from 'debug';
import pkg from 'axios-debug-log';

function changeElement(element) {
  if (element.match(/\W/)) {
    return '-';
  }
  return element;
};

const logPageLoader = debug('page-loader');

const createDirectory = (filepath) => {
  return new Promise((resolve, rejects) => {
    logPageLoader(`Создаем директорию для загрузки файлов`);
    const dirrectory = path.parse(filepath).dir;
    const nameForDirrectory = path.parse(filepath).name.concat('_files');
    const nameForDir = `${dirrectory}/${nameForDirrectory}`;
    fs.mkdir(nameForDir)
      .then(() => {
        logPageLoader(`Директория для загрузки файлов создана ${nameForDir}`);
        resolve(nameForDir);
      })
      .catch(err => rejects(err));
  });
};

const filtredImageList = (filepath) => {
  logPageLoader(`приступаем к формированию списка изображений`);
  return new Promise((resolve, rejects) => {
    fs.readFile(filepath, 'utf-8')
      .then(response => {
        const doc = cheerio.load(response);
        const imageList = doc('img').get().map(e => e.attribs.src);
        const filtredImageList = imageList.filter(el => {
          if(el.startsWith('data')) {
            return undefined;
          }
          return el;
        }).filter(el => el !== undefined);
        logPageLoader(`формирование списка изображений завершено`);
        resolve(filtredImageList);
      })
      .catch(err => rejects(err));
  })
};

const writeFile = (nameForDir, list, url) => {
  logPageLoader(`получен список изображений ${list}`);
  const myURL = new URL(url);
  const originURL = myURL.origin;
  const hostUrl = myURL.host;
  return list.map(src => {
    return new Promise((resolve, rejects) => {
      logPageLoader(`Приступаем к скачиванию изображения по ссылке ${src}`);
      axios({
        method: 'get',
        url: src.startsWith('/') ? `${originURL}${src}` : src,
        responseType: 'stream',
      })
        .then(answer => {
          logPageLoader(`получен ответ от ${src}`);
          const format = path.parse(src).ext;
          const srcDirectory = path.parse(src).dir;
          const srcName = path.parse(src).name;
          const nameForFileWithoutProtocolAndExt = `${hostUrl}${srcDirectory}/${srcName}`;
          const nameForFileWithoutProtocol = nameForFileWithoutProtocolAndExt.split('');
          const nameForNewFile = nameForFileWithoutProtocol
            .map(element => changeElement(element))
            .join('')
            .concat(format);
          const pathToFile = nameForDir.concat( "/" + nameForNewFile);
          logPageLoader(`приступаем к записи файла с изображением`);
          fs.writeFile(pathToFile, answer.data);
          logPageLoader(`Скачивание изображения ${src} завершено`);
          resolve({ after: `${path.basename(nameForDir)}/${nameForNewFile}`, before: src });
        })
        .catch(err => {
          logPageLoader(`Скачать изображение по адресу ${src} не получилось`);
          rejects(err);
        });
    });
  })
};

const changePathsInFile = (filepath, imagePaths) => {
  return new Promise((resolve, rejects) => {
    fs.readFile(filepath, 'utf-8')
      .then(response => {
        const doc = cheerio.load(response);
        doc('img').get()
          .filter(el => el.attribs.src.startsWith('data') ? undefined : el.attribs.src)
          .filter(el => el !== undefined)
          .map(image => {
            const before = doc(image).attr('src');
            const found = imagePaths.find(ip => ip.before === before);
            const { after } = found;
            doc(image).attr('src', after);
            fs.writeFile(filepath, doc.html());
            resolve();
          });
      })
      .catch(err => rejects(err));
  });
};

const downloaderImages = (url, filepath) => {
  return new Promise((resolve, rejects) => {
    createDirectory(filepath)
      .then(nameForDir => {
        filtredImageList(filepath)
        .then(list => {
          const requestPromises = writeFile(nameForDir, list, url);
          return Promise.all(requestPromises);
        })  
        .then(imagePaths => {
          changePathsInFile(filepath, imagePaths)
          .then(() => resolve(nameForDir))
          .catch(err => rejects(err));
        });
      });
  });
};

export default downloaderImages;