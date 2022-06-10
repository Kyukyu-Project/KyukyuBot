/**
 * @typedef {import('./typedef.js').ClientConfig} ClientConfig
 */

/** @type ClientConfig */
export const DEFAULT_CONFIG = {
  'pm2-process-name': 'Discord Bot',
  'default-prefix': '?',
  'default-lang': 'en',
  'owner-role-id': '',
  'owner-guild-id': '',
  'client-data-path': './client-data/',
};

export const DEFAULT_CONFIG_FILE = './app.json';
