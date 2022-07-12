// Make sure ES engine has all the core functions
import 'core-js/es/index.js';

// Get application configuration
import {clientToken} from './src/app-config.js';

// Load logger
import './src/logger.js';

// Load localization helper
import {l10n} from './src/l10n.js';

// Load command manager
import {commands} from './src/commands.js';

// Load Discord client
import {client} from './src/client.js';

// Initialize
l10n.load();
commands.load();

commands.client = client;

client.ready();
client.login(clientToken);
