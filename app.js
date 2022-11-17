// Make sure ES engine has all the core functions
import 'core-js/es/index.js';

import {execSync} from 'child_process';

// Get application configuration
import {clientConfig} from './src/app-config.js';

import './src/logger.js';
import {l10n} from './src/l10n.js';
import {commands} from './src/commands.js';
import {client} from './src/client.js';

(async function() {
  await l10n.load();

  // Check if resources are up to date
  if ((process.env.npm_package_version) && (l10n.version)) {
    if (l10n.version !== process.env.npm_package_version) {
      execSync('npm run build');
      execSync('npm run deploy');
      process.exit();
    }
  }

  commands.load();
  commands.client = client;
  client.registerEventHandlers();
  client.login(clientConfig['login-token']);
})();
