/* eslint-disable max-len */
/**
* @typedef {import('./client.js').default} Client
* @typedef {import('discord.js').Guild} Guild
* @typedef {import('discord.js').Channel} Channel
* @typedef {import('discord.js').Message} Message
* @typedef {import('discord.js').Interaction} Interaction
* @typedef {import('discord.js').User} User
*/

/**
 * Client configuration
 * @typedef {Object} ClientConfig
 * @property {string} `default-prefix` Default command prefix
 * @property {string} `default-lang` Default language
 * @property {string} `login-token` Client login token
 * @property {string} `owner-role-id` Id of client developer's role
 * @property {string} `owner-server-id` Id of client developer's guild
 * @property {string} `client-data-path` Path for locally saved client data
 */

/**
 * Guild settings
 * @typedef {Object} GuildSettings
 * @property {string} name - Cached name of the guild
 * @property {string} lang - Language
 * @property {string} `command-prefix` - Command prefix
 * @property {string} `bot-channel` - Id of the bot channel
 * @property {string} `mod-roles` - Ids of moderator roles
 * @property {string} `helper-roles` - Ids of helper roles
 */

/**
 * User settings
 * @typedef {Object} UserSettings
 * @property {string} name - Cached name of the user
 * @property {string} lang - Language
 */
/**
 * User permissions
 * @typedef {Object} UserPermissions
 * @property {boolean} hasOwnerPermission - Can the user execute owner-only commands?
 * @property {boolean} hasAdminPermission - Can the user execute guild admin commands?
 * @property {boolean} userIsMod - Does the user have a moderator role?
 * @property {boolean} userIsHelper - Does the user have a helper role?
 * @property {boolean} applyCooldown - Do we set a cool-down (if the command has cool-down)?
 */

/**
 * @typedef {Object} CommandContextBase
 * @property {Client} client - bot client
 * @property {Guild} [guild] - guild where the command was executed
 * @property {GuildSettings} [guildSettings] - guild settings
 * @property {Channel} channel - channel where the command was executed
 * @property {Message} message - message that initiated the command
 * @property {User} user - User who initiated the command
 * @property {string} lang - Language
 * @property {string} commandAliasUsed - Command name/alias that was used
 * @property {string} commandPrefix - Command prefix
 * @property {string[]} args - Parsed command arguments
 */

/**
 * @typedef {Object} InteractionContextBase
 * @property {Client} client - bot client
 * @property {Guild} [guild] - guild where the command was executed
 * @property {Channel} channel - channel where the command was executed
 * @property {Interaction} interaction - message that initiated the command
 * @property {User} user - User who initiated the command
 * @property {string} lang - Language
 */

/**
 * Context object for slash command deployment
 * @typedef {Object} DeploymentContext
 * @property {Client} client - bot client
 * @property {Guild} guild - the target guild
 * @property {GuildSettings} guildSettings - settings of the target guild
 * @property {string} lang - language of the target guild
 */

/**
 * Command context
 * @typedef {UserPermissions & CommandContextBase} CommandContext
 */

/**
 * Interaction context
 * @typedef {UserPermissions & InteractionContextBase} InteractionContext
 */

/**
 * Execute
 * @async
 * @name CommandExecute
 * @function
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
*/

/**
 * Command
 * @typedef {Object} Command
 * @property {string} canonName - Canonical (internal) name
 * @property {string} name - Command name
 * @property {COMMAND_PERM} commandPerm - Command type
 * @property {boolean} requireArgs - Does this command require argument(s)?
 * @property {boolean} cooldown - Does this command have cool-down?
 * @property {CommandExecute} execute
 */

/**
 * @typedef {Object} CommandActionResult
 * @property {string} response - Response message
 * @property {boolean} success - Is the command successful?
 */

/**
 * @readonly
 * @enum {number}
 */
export const COMMAND_PERM = {
  OWNER: 9, // Can only be used by client owners
  ADMIN: 7, //  Can only be used by guild administrator
  MODERATOR: 6, //  Can only be used by moderator and guild administrator
  GENERAL: 5, // Can be used by anyone
  FUN: 2, // Fun commands
};

export const unused = {};
