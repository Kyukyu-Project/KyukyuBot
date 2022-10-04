// Make sure ES engine has all the core functions
import 'core-js/es/index.js';

// Get application configuration
import {clientConfig} from './src/app-config.js';

import './src/logger.js';
import {l10n} from './src/l10n.js';
import {commands} from './src/commands.js';
import {client} from './src/client.js';

(async function() {
  await l10n.load();
  if (l10n.version !== process.env.npm_package_version) {
    console.error(
        'Error loading resources (file version mismatch).\n' +
        'Please execute \'npm run build\' and \'npm run deploy\' again.',
    );
    process.exit();
  }
  commands.load();
  commands.client = client;
  client.ready();
  client.login(clientConfig['login-token']);
})();
