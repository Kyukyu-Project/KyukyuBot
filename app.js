import {existsSync, readFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {getFilesFromDir} from './utils/utils.js';
import Client from './src/client.js';

const __dirname = resolve();
global.__basedir = __dirname;

const CLIENT_CONFIG_FILE = './app.json';

/**
 * @typedef {import('./typedef.js').ClientConfig} ClientConfig
 */

// Full file path of the client config file
const configFilePath =
  resolve(process.argv.slice(2)?.[0] || CLIENT_CONFIG_FILE);

if (!existsSync(configFilePath)) {
  throw new Error(`Config file not found: ${configFilePath}`);
}

const userConfig = JSON.parse(readFileSync(configFilePath, 'utf8'));

const clientToken =
    userConfig?.['login-token']?.value?.trim() ||
    process.env.DISCORD_TOKEN;

if (!clientToken) throw new Error('Login token unknown');

/** @type ClientConfig */
const clientConfig = {};

/** @type ClientConfig */
const defaultConfig = {
  'default-prefix': '?',
  'default-lang': 'en',
  'owner-role-id': '',
  'owner-guild-id': '',
  'client-data-path': resolve('./client-data/'),
};

Object.keys(defaultConfig).forEach((property) => {
  clientConfig[property] =
      userConfig?.[property]?.value?.trim() ||
      defaultConfig[property];
});

if (clientConfig['client-data-path']) {
  // Convert to absolute file path
  clientConfig['client-data-path'] = resolve(
      dirname(configFilePath),
      clientConfig['client-data-path'],
  );
}

const client = new Client(clientConfig);

// Load language files
/** @type {Object.<string, string>} */
const l10nDirectories = {
  'en': './locales/en',
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
];

commandDirectories.forEach((dir) => {
  client.commands.loadCommandFiles(
      getFilesFromDir(resolve(__dirname, dir), ['.js'], 3),
  );
});

client.ready();
// client.on('messageCreate', (msg) => client.onMessageCreate(msg));
client.login(clientToken);
