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
import CooldownManager from './cooldowns.js';
import {saveCollectionToFile, createCollectionFromFile, parseCommandArguments}
  from '../utils/utils.js';

import {COMMAND_TYPE} from '../typedef.js';

/**
 * @typedef {import('discord.js')} Discord
 * @typedef {import('../typedef.js').CommandContext} CommandContext
 * @typedef {import('../typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../typedef.js').UserSettings} UserSettings
 * @typedef {import('../typedef.js').ClientConfig} ClientConfig
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

    /**
     * Command Manager
     * @type {CommandManager}
     */
    this.commands = new CommandManager();

    /**
     * Cooldown Manager
     * @type { CooldownManager}
     */
    this.cooldowns = new CooldownManager();

    this.l10n.defaultLang = clientConfig['default-lang'];

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
   * Handle message
   * @param {Discord.Message} msg
   */
  async onMessageCreate(msg) {
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

    if ((cmd.requireArgs) && (parsedArgs.length == 0)) return;

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

    // Check for permission
    if (channel.type === 'DM') {
      setCooldown = false;
      hasPermission =
          (cmd.commandType !== COMMAND_TYPE.OWNER) &&
          (cmd.commandType !== COMMAND_TYPE.ADMIN);
    } else if (channel.type === 'GUILD_TEXT') {
      /** @type {Permissions} */
      const memberPermissions = msg.member.permissions;
      switch (cmd.commandType) {
        case COMMAND_TYPE.OWNER:
          if (guild.id == this.ownerGuildId) {
            hasPermission =
                (this.ownerRoleId)?
                msg.member.roles.cache.some((r)=>r.id = this.ownerRoleId):
                memberPermissions.has(Permissions.FLAGS.ADMINISTRATOR);
          }
          break;
        case COMMAND_TYPE.ADMIN:
          hasPermission =
            memberPermissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
            memberPermissions.has(Permissions.FLAGS.MANAGE_GUILD);
          break;
        // case COMMAND_TYPE.MODERATOR: break;
        default:
          hasPermission = true;
          if (
            (memberPermissions.has(Permissions.FLAGS.ADMINISTRATOR)) ||
            (channel.id == guildSettings['bot-channel'])
          ) {
            // setCooldown = false;
          } else {
            setCooldown = true;
          }
      } // switch (cmd.commandType)
    }

    if (!hasPermission) return;

    /** @type CommandContext */
    const cmdContext = {
      client: this,
      channel: channel,
      message: msg,
      user: user,
      lang: lang,
      commandAliasUsed: cmdAlias,
      args: parsedArgs,
      setCooldown: setCooldown,
    };
    if (msg.channel.type === 'GUILD_TEXT') {
      cmdContext.guild = guild;
      cmdContext.guildSettings = guildSettings;
    }

    if (this.cooldowns.getCooldown(guild.id, user.id, cmdName)) {
      return false;
    } else if (cmd.cooldown) {
      this.cooldowns.setCooldown(guild.id, user.id, cmdName, cmd.cooldown);
    }

    cmd.execute(cmdContext)
        .then((v) => {
          if (typeof v == 'boolean') {
            this.log(
                `${v?'✓':'✗'} ${(new Date()).toISOString()} ${cmdName}\n`,
            );
          }
        })
        .catch((error) => {
          this.log(`✗ ${(new Date()).toISOString()} ${cmdName}\n`);
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
