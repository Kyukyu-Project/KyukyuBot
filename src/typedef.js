/**
* @typedef {import('./client.js').Client} Client
* @typedef {import('discord.js').Guild} Guild
* @typedef {import('discord.js').Channel} Channel
* @typedef {import('discord.js').Message} Message
* @typedef {import('discord.js').BaseMessageOptions} BaseMessageOptions
* @typedef {import('discord.js').CommandInteraction} CommandInteraction
* @typedef {import('discord.js').InteractionReplyOptions} InteractionReplyOptions
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
 * @property {string[]} `helper-roles` - Ids of bot helper roles
 * @property {string} [`trivia-broadcast-channel`] - Id of the trivia's broadcast (announcement) channel
 * @property {string} [`trivia-game-channel`] - Id of the trivia's game channel
 */

/**
 * Context object for interaction reply
 * @typedef {Object} ReplyContext
 * @property {CommandInteraction} interaction - Interaction that initiated the command
 * @property {string} locale - Locale of the originating command
 * @property {content} content - Content
 * @property {string} dbResKey - Resource key of the content database
 * @property {string} [userId] - Id of the original user
 * @property {string} [taggedUserId] - Id of the tagged user
 */

/**
 * Context object for command interaction
 * @typedef {Object} CommandContext
 * @property {Client} client - Bot client
 * @property {Guild} [guild] - Server where the command was executed
 * @property {GuildSettings} [guildSettings] - Server settings
 * @property {Channel} channel - Channel where the command was executed
 * @property {CommandInteraction} interaction - Interaction that initiated the command
 * @property {Message} [responseMessage] - Interaction response
 * @property {BaseMessageOptions} [responseContent] - Cached content of the interaction response
 * @property {User} user - User who initiated the command
 * @property {string} locale - Locale of the originating command
 * @property {boolean} userIsAdmin - User is a server admin
 * @property {boolean} userIsHelper - User has a bot helper role
 * @property {number} cooldown - Command cooldown (in seconds)
 * @property {string} cooldownKey - Key to cooldown entry
 * @property {boolean} inBotChannel - Is the channel the bot-command channel?
 * @property {Date} time - Execution time of this command
 */

/**
 * Context object for message
 * @typedef {Object} MessageContext
 * @property {Client} client - Bot client
 * @property {Guild} [guild] - Server where the command was executed
 * @property {GuildSettings} [guildSettings] - Server settings
 * @property {Channel} channel - Channel where the command was executed
 * @property {Message} message - Message that initiated the command
 * @property {User} user - User who initiated the command
 * @property {string} locale - Preferred locale of the guild
 * @property {boolean} userIsAdmin - User is a server admin
 * @property {boolean} userIsHelper - User has a bot helper role
 * @property {number} cooldown - Command cooldown (in seconds)
 * @property {string} cooldownKey - Key to cooldown entry
 * @property {boolean} inBotChannel - Is the channel the bot-command channel?
 * @property {Date} time - Execution time of the message
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

/**
 * Control panel handler
 * @typedef {Object} ControlPanelHandler
 * @property {string} panelName - Control panel name
 * @property {boolean} super - Is this control panel for super-admin?
 * @property {Function} getNavMenuItem - Top menu item getter function
 * @property {Function} getContent - Panel page getter function
 * @property {Function} handleInteraction - Interaction handler function
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
 * Container module
 * @typedef {Object} CommandContainer
 * @property {CommandHandler} [command] - Command handler
 * @property {ControlPanelHandler} [controlPanel] - Control panel handler
 */


export const unused = {};
