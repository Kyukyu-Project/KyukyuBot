// Get application configuration
import {getClientConfig} from './utils/load-config.js';
const __dirname = resolve();
const [clientConfig, clientToken] = getClientConfig(__dirname);

// Make sure ES engine has all the core functions
import 'core-js/es/index.js';

// Initiate Discord client
import Client from './src/client.js';
const client = new Client(clientConfig);

import {resolve} from 'path';
import {getFilesFromDir} from './utils/utils.js';

// Load language files
/** @type {Object.<string, string>} */
const l10nDirectories = {
  'de': './locales/de',
  'en': './locales/en',
  'zh-tw': './locales/zh-tw',
};
for (const [lang, dir] of Object.entries(l10nDirectories)) {
  client.l10n.loadLanguageFiles(
      lang, getFilesFromDir(resolve(__dirname, dir), ['.json'], 3),
  );
}

const commandDirectories = [
  './commands/admin',
  './commands/owner',
  './commands/general',
  './commands/aow',
  './custom-commands/',
];

commandDirectories.forEach((dir) => {
  client.commands.loadCommandFiles(
      getFilesFromDir(resolve(__dirname, dir), ['.js'], 3),
  );
});

client.ready();
client.login(clientToken);
