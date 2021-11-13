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
  return axios({
    method: 'get',
    url: htmlPath,
  })
    .then(response => {
      const nameForFileWithoutProtocol = htmlPath.slice(8).split('');
      const nameForNewFile = nameForFileWithoutProtocol.map(element => renameFile(element)).join('').concat('.html');
      const pathToFile = currentDir.concat( "/" + nameForNewFile);
      writeFile(pathToFile, response.data);
      console.log(pathToFile);
    })
    .catch((error => {
      console.log('перейти по указанной странице не получилось');
    }))
});

export default downloaderPage;
