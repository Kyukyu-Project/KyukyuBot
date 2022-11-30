// Get application configuration
import {clientConfig} from './src/app-config.js';

// Start application using process manager

import pm2 from 'pm2';
import {resolve} from 'path';

pm2.connect(function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  try {
    const processConfig = {
      script: './app.js',
      name: clientConfig['process-name'],
      env: {
        npm_package_version: process.env.npm_package_version,
      },
      log_date_format: 'YYYY-MM-DDTHH:mm:ss.sssZ',
      out_file: resolve(clientConfig['client-data-dir'], './pm2.log'),
      error_file: resolve(clientConfig['client-data-dir'], './pm2.error'),
      args: process.argv.slice(2)?.[0],
      node_args: '--no-warnings',
    };

    pm2.start(processConfig, function(err, apps) {
      if (err) {
        console.error(err);
        pm2.delete(processConfig.name);
      }
      pm2.disconnect(); // Disconnects from PM2
    });
  } catch (error) {
    console.error('Cannot load configuration file.\n', error);
  }
});
