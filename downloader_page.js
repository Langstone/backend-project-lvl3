import dirname from 'path';
import { writeFile } from 'fs/promises';
import axios from 'axios';

function renameFile(element) {
  if (element.match(/\W/)) {
    return '-';
  }
  return element;
};


const downloaderPage = ((htmlPath, currentDir = dirname) => {
  return new Promise(resolve => {
    axios({
      method: 'get',
      url: htmlPath,
    })
    .then(async response => {
      const nameForFileWithoutProtocol = htmlPath.slice(8).split('');
      const nameForNewFile = nameForFileWithoutProtocol.map(element => renameFile(element)).join('').concat('.html');
      const pathToFile = currentDir.concat( "/" + nameForNewFile);
      await writeFile(pathToFile, response.data);
      resolve(pathToFile);
    })
    .catch(() => {
      console.log('перейти по указанной странице не получилось');
    });
  })
});
export default downloaderPage;