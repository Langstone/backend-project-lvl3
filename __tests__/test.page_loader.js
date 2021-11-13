import path from 'path';
import dirname from 'path';
import nock from 'nock';
import downloaderPage from '../downloader_page.js';
import { mkdtemp, readFile } from 'fs/promises';
import os from 'os';

const shared = {};

beforeAll(async () => {
  shared.fixture = await readFile(path.join(`${dirname}`, '..', '/__fixtures__/ru-hexlet-io-courses.html'), 'utf-8');
  const request = nock('https://ru.hexlet.io')
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
