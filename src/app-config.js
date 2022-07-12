import {statSync, existsSync, readFileSync} from 'fs';
import {resolve} from 'path';

/**
 * @typedef {import('./typedef.js').ClientConfig} ClientConfig
 * @typedef {import('.../src/typedef.js').CommandContext} CommandContext
 */

/** @type ClientConfig */
const DEFAULT_CONFIG = {
  'pm2-process-name': 'Discord Bot',
  'default-prefix': '?',
  'default-lang': 'en',
  'login-token': '',
  'owner-role-id': '',
  'owner-server-id': '',
  'client-data-path': './client-data/',
};

/** Base directory of this application */
const appPath = resolve();

/** app config file name - full path */
const configFileName = resolve(
    appPath, process.argv.slice(2)?.[0] || './app.json');

if (!existsSync(configFileName)) {
  throw new Error(`Config file not found: ${configFileName}`);
}

const config = JSON.parse(readFileSync(configFileName, 'utf8'));

/**
 * @type {ClientConfig}
 * Client configuration
 **/
export const clientConfig = {};

// Convert appConfig from
//    { "field": { "description": description, "value": value }... }
// to
//    { "field": value... }
// format
Object.keys(DEFAULT_CONFIG).forEach((property) => {
  clientConfig[property] =
    config?.[property]?.value?.trim() ||
    DEFAULT_CONFIG[property];
});

// Resolve `client-data-path` relative to parent directory of
// config file ('app.json')
const clientDataPath = resolve(
    resolve(configFileName, './../'),
    clientConfig['client-data-path'],
);

clientConfig['client-data-path'] = clientDataPath;

if (existsSync(clientDataPath)) {
  if (!statSync(clientDataPath).isDirectory()) {
    throw new Error(
        `Error accessing client-data directory (${clientDataPath})`,
    );
  }
} else {
  try {
    mkdirSync(clientDataPath, {recursive: true});
  } catch (error) {
    throw new Error(
        `Error creating client-data directory (${clientDataPath})`,
    );
  }
}

/**
 * @type {string}
 * Client login token
 * */
export const clientToken =
  clientConfig['login-token'] ||
  process.env.DISCORD_TOKEN;

if (!clientToken) throw new Error('Login token unknown');
