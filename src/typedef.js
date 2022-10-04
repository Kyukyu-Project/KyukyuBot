/* eslint-disable max-len */
/**
* @typedef {import('./client.js').default} Client
* @typedef {import('discord.js').Guild} Guild
* @typedef {import('discord.js').Channel} Channel
* @typedef {import('discord.js').Message} Message
* @typedef {import('discord.js').CommandInteraction} CommandInteraction
* @typedef {import('discord.js').User} User
*/

/**
 * Client configuration
 * @typedef {Object} ClientConfig
 * @property {string} `default-locale` Default locale
 * @property {string} `client-id` Client id
 * @property {string} `login-token` Client login token
 * @property {string} `owner-server-id` Id of client developer's server
 * @property {string} `client-data-dir` Path for locally saved client data
 */

/**
 * Server settings
 * @typedef {Object} GuildSettings
 * @property {string} name - Cached name of the guild
 * @property {string} `bot-channel` - Id of the bot channel
 * @property {string} `helper-roles` - Ids of helper roles
 */

/**
 * Context object for interaction reply
 * @typedef {Object} ReplyContext
 * @property {CommandInteraction} interaction - Interaction that initiated the command
 * @property {string} locale - Locale of the originating command
 * @property {string} [text] - Text content
 * @property {Object} [embed] - Embed content
 * @property {Object[]} [embeds] - Array of embed content
 * @property {string} [`tagged-user-id`] - Id of the tagged user
 */

/**
 * Context object for command interaction
 * @typedef {Object} CommandContext
 * @property {Client} client - Bot client
 * @property {Guild} [guild] - Server where the command was executed
 * @property {GuildSettings} [guildSettings] - Server settings
 * @property {Channel} channel - Channel where the command was executed
 * @property {CommandInteraction} interaction - Interaction that initiated the command
 * @property {User} user - User who initiated the command
 * @property {string} locale - Locale of the originating command
 * @property {boolean} userIsAdmin - User is a server admin
 * @property {boolean} userIsHelper - User has a helper role
 */

/**
 * Application command handler
 * @typedef {Object} CommandHandler
 * @property {string} commandName - Command name
 * @property {number} cooldown - Cooldown (in seconds)
 * @property {Function} execute - Command handler function
 * @property {Function} [autocomplete] - Autocomplete handler function
 */

/**
 * Data for application command building and deployment
 * @typedef {Object} CommandBuilderData
 * @property {string} commandName - Command name
 * @property {boolean} global - Is this a global command?
 * @property {boolean} ownerOnly - Is this a owner-only command?
 * @property {boolean} dm - Can this command be used in DM?
 * @property {Object} commandData - Command data
 * @property {string[]} [servers] - Servers where this command can be used (non-global command)
 */

/**
 * @typedef {Object} CommandActionResult
 * @property {string} response - Response message
 * @property {boolean} success - Is the command successful?
 */

/**
 * Command help data
 * @typedef {Object} CommandHelpData
 * @property {string} id - Help identifier
 * @property {string} title - Title
 * @property {string} content - Content
 * @property {string[]} keywords - List of keywords
 */

export const unused = {};
