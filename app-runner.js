// Get application configuration
import {getClientConfig} from './utils/load-config.js';
const __dirname = resolve(); ;
const [clientConfig] = getClientConfig(__dirname);

// Start application using process manager

import pm2 from 'pm2';
import {resolve} from 'path';
import {readFileSync} from 'fs';

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
      out_file: resolve(clientConfig['client-data-path'], './pm2.log'),
      error_file: resolve(clientConfig['client-data-path'], './pm2.error'),
      args: process.argv.slice(2)?.[0],
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
});
