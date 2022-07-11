// Make sure ES engine has all the core functions
import 'core-js/es/index.js';

// Get application configuration
import {clientToken} from './src/app-config.js';

// Load logger
import './src/logger.js';

// Load localization helper
import './src/l10n.js';

// Load command manager
import {commands} from './src/commands.js';

// Load Discord client
import {client} from './src/client.js';

commands.client = client;
client.commands = commands;

client.ready();
client.login(clientToken);
