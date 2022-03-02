import path from 'path';
import dirname from 'path';
import nock from 'nock';
import downloaderPage from '../downloader_page.js';
import { mkdtemp, readFile, access } from 'fs/promises';
import os from 'os';
import downloaderImages from '../downloader_images.js';
import downloaderFiles from '../downloader_files.js';
import { constants } from 'fs';

const shared = {};

beforeAll(async () => {
  shared.fixture = await readFile(path.join(`${dirname}`, '..', '/__fixtures__/ru-hexlet-io-courses.html'), 'utf-8');
  shared.changedFixture = await readFile(path.join(`${dirname}`, '..', '/__fixtures__/changed_html.html'), 'utf-8');
  shared.changedFixtureForImage = await readFile(path.join(`${dirname}`, '..', '/__fixtures__/changed_html_forFiles.html'), 'utf-8');
  shared.image = await readFile(path.join(`${dirname}`, '..','/__fixtures__/image_processing20220109-26-oblkto.png'), 'utf-8');
  nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .reply(200, shared.fixture);

    nock('https://ru.hexlet.io')
    .persist()
    .get('/assets/application.css')
    .reply(200);
    
    nock('https://ru.hexlet.io')
    .persist()
    .get('/packs/js/runtime.js')
    .reply(200);  
});

beforeEach(async () => {
  shared.path = await mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('check downloader_page', async () => {
  await downloaderPage('https://ru.hexlet.io/courses', shared.path);
  const actual = await readFile(path.join(`${shared.path}`, '/ru-hexlet-io-courses.html'), 'utf-8');
  expect(actual).toEqual(shared.fixture);
});

test('check downloader_images', async () => {
  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, shared.image, {
      'content-type': 'application/octet-stream',
      'content-disposition': 'attachment; filename=reply_file_2.tar.gz',
  });
  const fp = await downloaderPage('https://ru.hexlet.io/courses', shared.path);
  await downloaderImages('https://ru.hexlet.io/courses', fp);
  const actual = await readFile(fp, 'utf-8');
  expect(actual).toEqual(shared.changedFixture);
  expect(access(`${shared.path}/ru-hexlet-io-courses_files`, constants.R_OK | constants.W_OK));
  expect(access(`${shared.path}/ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png`, constants.R_OK | constants.W_OK));
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
    const nameForDirectory = await downloaderImages('https://ru.hexlet.io/courses', fp);
    await downloaderFiles(fp, nameForDirectory, 'https://ru.hexlet.io/courses');
    const actual = await readFile(fp, 'utf-8');
    expect(actual).toBe(shared.changedFixtureForImage);
  })