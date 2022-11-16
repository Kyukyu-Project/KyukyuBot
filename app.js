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
  commands.load();
  commands.client = client;
  client.registerEventHandlers();
  client.login(clientConfig['login-token']);
})();
