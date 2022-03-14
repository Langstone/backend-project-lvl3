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
};

const logPageLoader = debug('page-loader');

const filtredFilesListFromLink = (url, filepath, tag) => {
  const myURL = new URL(url);
  const hostURL = myURL.host;
  const originURL = myURL.origin; 
  return new Promise((resolve, rejects) => {
    fs.readFile(filepath, 'utf-8')
      .then(response => {
        let linkList;
        const doc = cheerio.load(response);
        if(tag === 'link') {
          linkList = doc('link').get()
            .map(el => el.attribs.href)
            .filter(el => el !== undefined)
            .map(el => el.startsWith('/') ? `${originURL}${el}` : el)
            .map(el => {
              const elURl = new URL(el);
              if(elURl.host === hostURL) {
                return el;
              };
            });
        }  
        else {
          linkList = doc('script').get()
            .map(el => el.attribs.src)
            .filter(el => el !== undefined)
            .map(el => el.startsWith('/') ? `${originURL}${el}` : el)
            .map(el => {
              const elURl = new URL(el);
              if(elURl.host === hostURL) {
                return el;
              };
            });
        }
        resolve(linkList);
      })
      .catch(err => rejects(err));  
  })
};


const writeFile = (nameForDir, pathsList, url) => {
  const myURL = new URL(url);
  const hostUrl = myURL.host;
  const list = pathsList.filter(el => el !== undefined);
  return list.map(src => {
    const srcURL = new URL(src);
    const pathnameSrcURL = srcURL.pathname;
    const directoryNameFromSrcURL = (el) => path.parse(el).dir ===  '/' ? path.parse(el).dir : `${path.parse(el).dir}/`;
    const nameFromSrcURL = path.parse(pathnameSrcURL).name;
    return new Promise((resolve, rejects) => {
      logPageLoader(`Приступаем к скачиванию файла ${src}`);
      axios({
        method: 'get',
        url: src,
        responseType: 'stream',
      })
        .then(answer => {
          const form = (src) => path.parse(src).ext === '' ? '.html' : path.parse(src).ext; 
          const format = form(src);
          const nameForFileWithoutProtocolAndExt = `${hostUrl}${directoryNameFromSrcURL(pathnameSrcURL)}${nameFromSrcURL}`;
          const fullSrc = (fp) => path.parse(fp).ext === '' ? `${fp}.html` : fp;
          const nameForFileWithoutProtocol = nameForFileWithoutProtocolAndExt.split('');
          const nameForNewFile = nameForFileWithoutProtocol
            .map(element => changeElement(element))
            .join('')
            .concat(format);
          const pathToFile = nameForDir.concat( "/" + nameForNewFile);
          fs.writeFile(pathToFile, answer.data);
          logPageLoader(`Скачивание файла ${src} завершено`);
          resolve({ after: `${path.basename(nameForDir)}/${nameForNewFile}`, before: fullSrc(src) });
        })
        .catch(err => rejects(err));
    });
  })
};

const changePathsInFileFromLink = (filepath, filesPaths, url, tag) => {
  const myURL = new URL(url);
  const hostURL = myURL.host;
  const originURL = myURL.origin; 

  return new Promise((resolve, rejects) => {
    fs.readFile(filepath, 'utf-8')
      .then(response => {
        const doc = cheerio.load(response);
        if(tag === 'link') {
          doc('link').get()
            .filter(el => el !== undefined)
            .filter(el => el.attribs.href.startsWith('/') ? el.attribs.href = `${originURL}${el.attribs.href}` : el)
            .filter(el => new URL(el.attribs.href).host === hostURL)
            .filter(el => path.parse(el.attribs.href).ext === '' ? el.attribs.href = `${el.attribs.href}.html` : `${el.attribs.href}`)
            .map(link => {
              const before = doc(link).attr('href');
              const { after } = filesPaths.find(ip => ip.before === before);
              doc(link).attr('href', after);
              fs.writeFile(filepath, doc.html())
            });
        }
        else {
          doc('script').get()
          .filter(el => el !== undefined)
            .filter(el => el.attribs.src.startsWith('/') ? el.attribs.src = `${originURL}${el.attribs.src}` : el)
            .filter(el => new URL(el.attribs.src).host === hostURL)
            .filter(el => path.parse(el.attribs.src).ext === '' ? el.attribs.src = `${el.attribs.src}.html` : `${el.attribs.src}`)
            .map(link => {
              const before = doc(link).attr('src');
              const { after } = filesPaths.find(ip => ip.before === before);
              doc(link).attr('src', after);
              fs.writeFile(filepath, doc.html())
            });
        };         
      })
      .catch(err => rejects(err));
  });
};

const downloaderFiles = (filepath, nameForDirectory, url) => {
  return new Promise((resolve, rejects) => {
    filtredFilesListFromLink(url, filepath, 'link')
      .then(linkList => {
        const requestPromises = writeFile(nameForDirectory, linkList, url);
        return Promise.all(requestPromises);
      })
        .then(filesPaths => {
          changePathsInFileFromLink(filepath, filesPaths, url, 'link')
            .then(() => {
              filtredFilesListFromLink(url, filepath, 'script')
                .then(linkList => {
                  const requestPromises = writeFile(nameForDirectory, linkList, url);
                  return Promise.all(requestPromises);
                })
                  .then(filesPaths => {
                    changePathsInFileFromLink(filepath, filesPaths, url, 'script')
                      .then(() => resolve())
                      .catch(err => rejects(err));
                  });
            });
        });  
  });
};

export default downloaderFiles;
