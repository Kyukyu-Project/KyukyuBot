import {
  resolvePath,
  makeDirectory,
  isDirectory,
  fileExists,
  readTJson,
} from './utils.js';

/**
 * @typedef {import('./typedef.js').ClientConfig} ClientConfig
 */

/** @type ClientConfig */
const defaultConfig = {
  'process-name': 'Discord Bot',
  'default-locale': 'en-US',
  'client-id': '',
  'login-token': '',
  'owner-server-id': '',
  'client-data-dir': './client-data/',
};

/** Base directory of this application */
const appDir = resolvePath();

/** Relative file path of config file */
const relConfigFilePath = process.argv.slice(2)?.[0] || './app-config.json';

/** Absolute file path of app-config file */
const configFilePath = resolvePath(appDir, relConfigFilePath);

/** Absolute directory path of app-config file */
const configFileDir = resolvePath(configFilePath, './../');

if (!fileExists((configFilePath))) {
  throw new Error(`Config file not found: ${configFilePath}`);
}

/**
 * @type {ClientConfig}
 * Client configuration
 **/
export const clientConfig = Object.assign(
    defaultConfig,
    readTJson(configFilePath),
);

/**
 * Absolute directory path of client-data directory
 */
const clientDataDir = resolvePath(
    // Resolve relative to parent directory of config file ('app-config.json')
    configFileDir,
    clientConfig['client-data-dir'],
);

clientConfig['client-data-dir'] = clientDataDir;

/** Make sure we have access to client-data directory */
function checkClientDataDir() {
  if (fileExists(clientDataDir)) {
    if (!isDirectory(clientDataDir)) {
      throw new Error(
          `Error accessing client-data directory (${clientDataDir})`,
      );
    }
  } else {
    try {
      makeDirectory(clientDataDir);
    } catch (error) {
      console.error(error);
      throw new Error(
          `Error creating client-data directory (${clientDataDir})`,
      );
    }
  }
}

checkClientDataDir();

if (!clientConfig['login-token']) throw new Error('Login token unknown');
