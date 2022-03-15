import downloaderImages from './downloader_images.js';
import downloaderPage from './downloader_page.js';
import downloaderFiles from './downloader_files.js';

export default function pageLoader(url, currentDir) {
  return new Promise((resolve, reject) => {
    downloaderPage(url, currentDir)
      .then(pathToFile => { 
        downloaderImages(url, pathToFile)
          .then(nameForDirectory => downloaderFiles(pathToFile, nameForDirectory, url))
            .then(() => resolve())
            .catch(err => reject(err));
      });
  })
};