// Make sure ES engine has all the core functions
import 'core-js/es/index.js';

// import {pathToFileURL} from 'url';
// import {getModuleDirectory, resolvePath} from './src/utils.js';

import {} from 'child_process';

// Get application configuration
import {clientConfig} from './src/app-config.js';

import './src/logger.js';
import {l10n} from './src/l10n.js';
import {commands} from './src/commands.js';
import {client} from './src/client.js';

(async function() {
  await l10n.load();
  if (l10n.version !== process.env.npm_package_version) {
    // const moduleDir = getModuleDirectory(import.meta);
    // const buildPath = resolvePath(moduleDir, './build/build.js');
    // await import(pathToFileURL(buildPath).href);

    exec('npm run build', (error, stdout, stderr) => {
      exec('npm run deploy', (error, stdout, stderr) => {
        process.exit();
      });
    });
  } else {
    commands.load();
    commands.client = client;
    client.ready();
    client.login(clientConfig['login-token']);
  }
})();
