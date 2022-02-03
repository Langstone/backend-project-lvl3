import path from 'path';
import dirname from 'path';
import nock from 'nock';
import downloaderPage from '../downloader_page.js';
import { mkdtemp, readFile, access } from 'fs/promises';
import os from 'os';
import downloaderFile from '../downloader_files.js';
import { constants } from 'buffer';

const shared = {};

beforeAll(async () => {
  shared.fixture = await readFile(path.join(`${dirname}`, '..', '/__fixtures__/ru-hexlet-io-courses.html'), 'utf-8');
  shared.changedFixture = await readFile(path.join(`${dirname}`, '..', '/__fixtures__/changed_html.html'), 'utf-8');
  shared.image = await readFile(path.join(`${dirname}`, '..','/__fixtures__/image_processing20211119-26-idxrsa.png'), 'utf-8');
  nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .reply(200, shared.fixture);
});

beforeEach(async () => {
  shared.path = await mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('check downloader_page', async () => {
  await downloaderPage('https://ru.hexlet.io/courses', shared.path);
  const actual = await readFile(path.join(`${shared.path}`, '/ru-hexlet-io-courses.html'), 'utf-8');
  expect(actual).toEqual(shared.fixture);
});

test('check downloader_files', async () => {
  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, shared.image, {
      'content-type': 'application/octet-stream',
      'content-length': shared.image.length,
      'content-disposition': 'attachment; filename=reply_file_2.tar.gz',
  });
  const fp = await downloaderPage('https://ru.hexlet.io/courses', shared.path);
  await downloaderFile('https://ru.hexlet.io/courses', fp);
  const actual = await readFile(fp, 'utf-8');
  expect(actual).toEqual(shared.changedFixture);
  expect(access(`${shared.path}/ru-hexlet-io-courses_files`, constants.R_OK | constants.W_OK));
  expect(access(`${shared.path}/ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png`, constants.R_OK | constants.W_OK));
  });