/**
* @typedef {import('./client.js').default} Client
* @typedef {import('discord.js').Guild} Guild
* @typedef {import('discord.js').Channel} Channel
* @typedef {import('discord.js').Message} Message
*/

/**
 * Client configuration
 * @typedef {Object} ClientConfig
 * @property {string} `default-prefix` - default command prefix
 * @property {string} `default-lang` - default language
 * @property {string} `owner-role-id` - Id of client developer's role
 * @property {string} `owner-guild-id` - Id of client developer's guild
 * @property {string} `client-data-path` - path for locally saved client data
 */

/**
 * Guild settings
 * @typedef {Object} GuildSettings
 * @property {string} name - Cached name of the guild
 * @property {string} lang - Language
 * @property {string} `command-prefix` - Command prefix
 * @property {string} `bot-channel` - Ids of the bot channel
 */

/**
 * User settings
 * @typedef {Object} UserSettings
 * @property {string} name - Cached name of the user
 * @property {string} lang - Language
 */

/**
 * Command context
 * @typedef {Object} CommandContext
 * @property {Client} client - bot client
 * @property {Guild} [guild] - guild where the command was executed
 * @property {GuildSettings} [guildSettings] - guild settings
 * @property {Channel} channel - channel where the command was executed
 * @property {Message} message - message that initiated the command
 * @property {User} user - User who initiated the command
 * @property {string} lang - Language
 * @property {CHANNEL_TYPE} channelType - Channel type
 * @property {USER_TYPE} userType - User type
 * @property {boolean} hasPermission - Does the user have permission?
 * @property {boolean} setCooldown - Does the command have cooldown?
 * @property {string} commandAliasUsed - Command name/alias that was used
 * @property {string} commandPrefix - Command prefix
 * @property {string[]} args - Parsed command arguments
 */

/**
 * @readonly
 * @enum {number}
 */
export const COMMAND_TYPE = {
  OWNER: 9, // Can be used by client owners only
  ADMIN: 7, //  Can be used by guild administrator only
  // MODERATOR: 6, //  Can be used by channel moderator only
  GENERAL: 5, // Can be used by anyone
  FUN: 2, // Fun commands
};

/**
 * @readonly
 * @enum {number}
 */
export const USER_TYPE = {
  OWNER: 9, // Client owner
  ADMIN: 7, //  Guild administrator
  GENERAL: 5, // General user
};

/**
 * @readonly
 * @enum {string}
 */
export const CHANNEL_TYPE = {
  DM: 'DM', // DM
  BOT: 'BOT', // Guild text channel for bot commands
  TEXT: 'TEXT', // Guild text channel
};

export const unused = {};
