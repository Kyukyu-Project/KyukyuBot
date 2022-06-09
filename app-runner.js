import pm2 from 'pm2';

import {existsSync, readFileSync} from 'fs';
import {resolve, dirname, join as joinPath} from 'path';
import {DEFAULT_CONFIG} from './src/const.js';

const CLIENT_CONFIG_FILE = './app.json';

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

const clientConfig = {};

Object.keys(DEFAULT_CONFIG).forEach((property) => {
  clientConfig[property] =
      userConfig?.[property]?.value?.trim() ||
      DEFAULT_CONFIG[property];
});

if (clientConfig['client-data-path']) { // Convert to absolute file path
  clientConfig['client-data-path'] = resolve(
      dirname(configFilePath),
      clientConfig['client-data-path'],
  );
}

pm2.connect(function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  try {
    const processConfig = {
      script: './app.js',
      name: clientConfig['pm2-process-name'],
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      out_file: joinPath(clientConfig['client-data-path'], 'pm2.log'),
      error_file: joinPath(clientConfig['client-data-path'], 'pm2.error'),
      args: configFilePath,
    };

    pm2.start(processConfig, function(err, apps) {
      if (err) {
        console.error(err);
        pm2.delete(processConfig.name);
      } else {
        console.log(
            readFileSync(resolve('splash.md'), 'utf8'),
        );
      }
      pm2.disconnect(); // Disconnects from PM2
    });
  } catch (error) {
    console.error('Cannot load configuration file.\n', error);
  }

  if (!existsSync(configFilePath)) {
    return;
  }
});
