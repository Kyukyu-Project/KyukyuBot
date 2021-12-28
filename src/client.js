/*
 * Main client class
 **/

import {
  existsSync,
  statSync,
  mkdirSync,
  createWriteStream} from 'fs';
import {join} from 'path';
import {
  Client as djsClient,
  Intents,
  Collection,
  Permissions} from 'discord.js';

import L10N from './l10n.js';
import CommandManager from './commands.js';
import {saveCollectionToFile, createCollectionFromFile, parseCommandArguments}
  from '../utils/utils.js';

import {COMMAND_TYPE, CHANNEL_TYPE, USER_TYPE} from './typedef.js';

/**
 * @typedef {import('discord.js')} Discord
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').GuildSettings} GuildSettings
 * @typedef {import('./typedef.js').UserSettings} UserSettings
 * @typedef {import('./typedef.js').ClientConfig} ClientConfig
 */

/** Extending Discord Client */
class Client extends djsClient {
  /**
   * @param {ClientConfig} clientConfig
   */
  constructor(clientConfig) {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
      partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    });

    /**
     * Default command prefix
     * @type {string}
     */
    this.defaultPrefix = clientConfig['default-prefix'];

    /**
     * Owner guild id
     * @type {string}
     */
    this.ownerGuildId = clientConfig['owner-guild-id'];

    /**
     * Owner role id
     * @type {string}
     */
    this.ownerRoleId = clientConfig['owner-role-id'];

    /**
     * Localization Manager
     * @type {L10N}
     */
    this.l10n = new L10N();
    this.l10n.defaultLang = clientConfig['default-lang'];

    /**
     * Command Manager
     * @type {CommandManager}
     */
    this.commands = new CommandManager();

    /**
     * Cooldown Manager
     * @type {Discord.Collection}
     */
    this.cooldowns = new Collection();

    /**
     * Flag for pausing all commands
     * @type {boolean}
     */
    this.pauseProcess = false;

    /**
     * Directory path for locally saved client data
     * @type {string}
     */
    this.clientDataPath = clientConfig['client-data-path'] || '';
    if (this.clientDataPath) {
      if (existsSync(this.clientDataPath)) {
        if (!statSync(this.clientDataPath).isDirectory()) {
          console.warn(
              'Error accessing the client-data directory: ',
              `${this.clientDataPath} is not a directory.`);
          this.clientDataPath = '';
        }
      } else {
        try {
          mkdirSync(this.clientDataPath, {recursive: true});
        } catch (error) {
          console.warn('Error creating the client-data directory');
          this.clientDataPath = '';
        }
      }
    }

    if (this.clientDataPath) {
      /**
       * File path for guild settings
       * @type {string}
       */
      this.guildConfigPath = join(this.clientDataPath, 'guilds.json');
      /**
       * Guild settings
       * @type {Discord.Collection}
       */
      this.guildConfig = createCollectionFromFile(this.guildConfigPath);

      /**
       * File path for user settings
       * @type {string}
       */
      this.userConfigPath = join(this.clientDataPath, 'users.json');
      /**
       * User settings
       * @type {Discord.Collection}
       */
      this.userConfig = createCollectionFromFile(this.userConfigPath);

      this.logger = createWriteStream(
          join(this.clientDataPath, 'commands.log'), {flags: 'a' /* append */},
      );
    } else {
      this.guildConfigPath = '';
      this.guildConfig = new Collection();
      this.userConfigPath = '';
      this.userConfig = new Collection();
    }
  } // constructor

  /**
   * Get a copy of the guild settings
   * @param {Discord.Guild} guild - Guild
   * @return {GuildSettings}
   */
  getGuildSettings(guild) {
    const settings = this.guildConfig.get(guild.id);
    if (settings) {
      return Object.assign({}, settings);
    } else {
      return {
        'name': guild.name,
        'lang': this.l10n.defaultLang,
        'command-prefix': this.defaultPrefix,
        'bot-channel': '',
      };
    }
  }

  /**
   * Update guild settings
   * @param {Discord.Guild} guild - Guild
   * @param {GuildSettings} settings - New settings
   */
  updateGuildSettings(guild, settings) {
    this.guildConfig.set(guild.id, Object.assign({}, settings));
    this.saveGuildSettings();
  }

  /**
   * Get a copy of the user settings
   * @param {Discord.User} user
   * @return {UserSettings}
   */
  getUserSettings(user) {
    const settings = this.userConfig.get(user.id);
    if (settings) {
      return Object.assign({}, settings);
    } else {
      return {
        'lang': this.l10n.defaultLang,
      };
    }
  }

  /**
   * Update guild settings
   * @param {Discord.User} user - User
   * @param {UserSettings} settings - New settings
   */
  updateUserSettings(user, settings) {
    this.userConfig.set(user.id, Object.assign({}, settings));
    this.saveUserSettings();
  }

  /**
   * Save guild settings
   */
  saveGuildSettings() {
    if (this.guildConfigPath) {
      saveCollectionToFile(this.guildConfig, this.guildConfigPath);
    }
  }

  /**
   * Save user settings
   */
  saveUserSettings() {
    if (this.userConfigPath) {
      saveCollectionToFile(this.userConfig, this.userConfigPath);
    }
  }

  /**
   * Log
   * @param {string} log - Log text
   */
  log(log) {
    if (this.logger) this.logger.write(log);
  }

  /**
   * Get command context
   * @param {Object} cmd
   * @param {string} cmdAlias
   * @param {string} lang
   * @param {string} prefix
   * @param {Discord.Guild} guild
   * @param {GuildSettings} guildSettings
   * @param {Discord.Channel} channel
   * @param {Discord.User} user
   * @param {Discord.Message} msg
   * @param {string[]} parsedArgs
   * @return {CommandContext}
   */
  getCommandContext(
      cmd, cmdAlias, lang, prefix,
      guild, guildSettings,
      channel, user, msg, parsedArgs,
  ) {
    /**
     * Does the user have permission to execute the command?
     * @type {boolean}
     */
    let hasPermission = false;

    /**
     * Do we need to set a cool-down for this command?
     * @type {boolean}
     */
    let setCooldown = false;

    /**
     * Channel type
     * @type {CHANNEL_TYPE}
     **/
    let channelType = CHANNEL_TYPE.TEXT;

    /**
     * User type
     * @type {USER_TYPE}
     **/
    let userType = USER_TYPE.GENERAL;

    if (channel.type === 'DM') {
      channelType  = CHANNEL_TYPE.DM;
      hasPermission =
          (cmd.commandType !== COMMAND_TYPE.OWNER) &&
          (cmd.commandType !== COMMAND_TYPE.ADMIN);
    } else if (channel.type === 'GUILD_TEXT') {
      const mRoles = msg.member.roles;
      const mPermissions = msg.member.permissions;
      if (guild.id == this.ownerGuildId) {
        if (
          this.ownerRoleId?
          mRoles.cache.some((r)=>r.id = this.ownerRoleId):
          mPermissions.has(Permissions.FLAGS.ADMINISTRATOR)
        ) {
          userType = USER_TYPE.OWNER;
        } else if (
          mPermissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
          mPermissions.has(Permissions.FLAGS.MANAGE_GUILD)
        ) {
          userType = USER_TYPE.ADMIN;
        };
      } else {
        if (
          mPermissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
          mPermissions.has(Permissions.FLAGS.MANAGE_GUILD)
        ) {
          userType = USER_TYPE.ADMIN;
        }
      }

      switch (cmd.commandType) {
        case COMMAND_TYPE.OWNER:
          hasPermission = (userType == USER_TYPE.OWNER);
          break;
        case COMMAND_TYPE.ADMIN:
          hasPermission =
              (userType == USER_TYPE.OWNER) ||
              (userType == USER_TYPE.ADMIN);
          break;
        // case COMMAND_TYPE.MODERATOR: break;
        default:
          hasPermission = true;
          if (channel.id == guildSettings['bot-channel']) {
            // setCooldown = false;
            channelType  = CHANNEL_TYPE.BOT;
          } else
          if ((userType == USER_TYPE.OWNER) || (userType == USER_TYPE.ADMIN)) {
            // setCooldown = false;
          } else {
            setCooldown = cmd.cooldown && (cmd.cooldown > 0);
          }
      } // switch (cmd.commandType)
    }

    /** @type CommandContext */
    const cmdContext = {
      client: this,
      channel: channel,
      message: msg,
      user: user,
      lang: lang,
      channelType: channelType,
      userType: userType,
      hasPermission: hasPermission,
      setCooldown: setCooldown,
      commandAliasUsed: cmdAlias,
      commandPrefix: prefix,
      args: parsedArgs,
    };
    if (channel.type === 'GUILD_TEXT') {
      cmdContext.guild = guild;
      cmdContext.guildSettings = guildSettings;
    }
    return cmdContext;
  }

  /**
   * Handle message
   * @param {Discord.Message} msg
   */
  async onMessageCreate(msg) {
    if (this.pauseProcess) return;
    if (msg.author.bot) return;

    // TODO: ECHO command

    const guild = msg.guild;
    const channel = msg.channel;
    const user = msg.author;

    /** @type {GuildSettings} */
    let guildSettings;

    let prefix;
    let lang;

    // Load guild settings
    if (guild) {
      guildSettings = this.getGuildSettings(guild);
      lang = guildSettings.lang;
      prefix = guildSettings['command-prefix'];
    } else {
      lang = this.getUserSettings(user).lang;
      prefix = this.defaultPrefix;
    }

    const parsedArgs = parseCommandArguments(prefix, msg.content);

    if (parsedArgs.length == 0) return;

    /** Command alias used */
    const cmdAlias = parsedArgs.shift();

    /** Canonical command name */
    const cmdName =
      this.l10n.getCanonicalName(lang, 'aliases.commands', cmdAlias);

    if (!cmdName) return;
    const cmd = this.commands.get(cmdName);

    const cmdContext = this.getCommandContext(
        cmd, cmdAlias, lang, prefix,
        guild, guildSettings, channel, user,
        msg, parsedArgs,
    );

    if (!cmdContext.hasPermission) return;

    if ((cmd.requireArgs) && (parsedArgs.length == 0)) {
      const helpTxt = this.l10n.getCommandHelp(lang, cmdName);
      if (helpTxt) {
        channel.send({
          content: helpTxt.replaceAll('?', prefix),
          reply: {messageReference: msg.id},
        });
      }
      return;
    }

    /**
     * Key for cooldown
     * @type {string}
     */
    let cooldownKey = '';

    if (cmdContext.setCooldown) {
      cooldownKey = `${guild.id}.${user.id}.${cmdName}`;
      if (this.cooldowns.get(cooldownKey)) return;
    }
    const now = new Date();

    cmd.execute(cmdContext)
        .then((result) => {
          if (typeof result == 'boolean') {
            if (result && setCooldown) {
              const cooldownMS = cmd.cooldown * 1000;
              const expiration = now.valueOf() + cooldownMS;
              this.cooldowns.set(cooldownKey, expiration);
              setTimeout(() => this.cooldowns.delete(cooldownKey), cooldownMS);
            }
            this.log(
                `${result?'✓':'✗'} ${now.toISOString()} ${cmdName}\n`,
            );
          }
        })
        .catch((error) => {
          this.log(`✗ ${now.toISOString()} ${cmdName}\n`);
          console.error(
              '--------------------------------------------------\n',
              `Error executing '${msg.content}'\n`,
              '> ' + error.message,
          );
        });
  }


  /**
   * Get ready
   */
  ready() {
    this.on('messageCreate', (msg) => this.onMessageCreate(msg));
  }
}

export default Client;
