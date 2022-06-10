import {existsSync, readFileSync} from 'fs';
import {resolve} from 'path';
import {
  DEFAULT_CONFIG,
  DEFAULT_CONFIG_FILE,
} from '../src/const.js';

/**
 * @typedef {import('../src/typedef.js').ClientConfig} ClientConfig
 * @typedef {import('.../src/typedef.js').CommandContext} CommandContext
 */

/**
 * Load application config file
 * @param {string} baseDir - base directory
 * @return {[ClientConfig, string]}
 */
export function getClientConfig(baseDir) {
  /** app config file - short path */
  const configFilePath = process.argv.slice(2)?.[0] || DEFAULT_CONFIG_FILE;

  /** app config file - full path */
  const configFileFullPath = resolve(baseDir, configFilePath);

  if (!existsSync(configFileFullPath)) {
    throw new Error(`Config file not found: ${configFileFullPath}`);
  }

  const appConfig = JSON.parse(readFileSync(configFileFullPath, 'utf8'));

  const clientToken =
    appConfig?.['login-token']?.value?.trim() ||
    process.env.DISCORD_TOKEN;

  if (!clientToken) throw new Error('Login token unknown');

  // Convert appConfig from
  //    { "field": { "description": description, "value": value }... }
  // to
  //    { "field": value... }
  // format

  /** @type {ClientConfig} */ const clientConfig = {};

  Object.keys(DEFAULT_CONFIG).forEach((property) => {
    clientConfig[property] =
      appConfig?.[property]?.value?.trim() ||
      DEFAULT_CONFIG[property];
  });

  clientConfig['client-data-path'] = resolve(
      baseDir,
      clientConfig['client-data-path'],
  );

  return [clientConfig, clientToken];
}
