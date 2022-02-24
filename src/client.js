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

import {COMMAND_PERM} from './typedef.js';

/**
 * @typedef {import('discord.js')} Discord
 * @typedef {import('./typedef.js').Command} Command
 * @typedef {import('./typedef.js').UserPermissions} UserPermissions
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').InteractionContext} InteractionContext
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
   * Get user permissions
   * @param {Discord.Guild} guild
   * @param {GuildSettings} guildSettings
   * @param {Discord.Channel} channel
   * @param {Discord.Message} msg
   * @return {UserPermissions}
   */
  getUserPermissions(guild, guildSettings, channel, msg) {
    if (channel.type === 'GUILD_TEXT') {
      const mRoles = msg.member.roles;
      const mPermissions = msg.member.permissions;

      const hasOwnerPermission =
          (guild.id == this.ownerGuildId) &&
          this.ownerRoleId?
          mRoles.cache.some((r)=>r.id = this.ownerRoleId):
          mPermissions.has(Permissions.FLAGS.ADMINISTRATOR);

      const hasAdminPermission =
          mPermissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
          mPermissions.has(Permissions.FLAGS.MANAGE_GUILD);

      const modeRoles = guildSettings['mod-roles'];
      const userIsMod =
          ((Array.isArray(modeRoles)) && (modeRoles.length > 0))?
          mRoles.cache.some((r)=>modeRoles.includes(r.id)):
          false;

      const helperRoles = guildSettings['helper-roles'];
      const userIsHelper =
          ((Array.isArray(helperRoles)) && (helperRoles.length > 0))?
          mRoles.cache.some((r)=>helperRoles.includes(r.id)):
          false;

      const noCooldown =
        hasOwnerPermission || hasAdminPermission ||
        userIsMod || userIsHelper ||
        (channel.id == guildSettings['bot-channel']);

      return {
        hasOwnerPermission: hasOwnerPermission,
        hasAdminPermission: hasAdminPermission,
        userIsMod: userIsMod,
        userIsHelper: userIsHelper,
        setCooldown: !noCooldown,
      };
    } else {
      return {
        hasOwnerPermission: false,
        hasAdminPermission: false,
        userIsMod: false,
        userIsHelper: false,
        setCooldown: false,
      };
    }
  }

  /**
   * Handle message
   * @param {Discord.Message} msg
   */
  async onMessageCreate(msg) {
    if (this.pauseProcess) return;
    if (msg.author.bot) return;

    const guild = msg.guild;
    const channel = msg.channel;
    const user = msg.author;

    /** @type {GuildSettings|undefined} */
    let guildSettings = undefined;

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

    /** Translation error */
    if (!this.commands.has(cmdName)) {
      console.error(`Cannot find command named "${cmdName}"`);
      return;
    }

    const cmd = this.commands.get(cmdName);

    if (!cmd.execute) return; // Application (/) command only

    /** @type {UserPermissions} */
    const userPermissions =
      this.getUserPermissions(guild, guildSettings, channel, msg);

    switch (cmd.commandPerm) {
      case COMMAND_PERM.OWNER:
        if (!userPermissions.hasOwnerPermission) return;
        break;
      case COMMAND_PERM.ADMIN:
        if (!userPermissions.hasAdminPermission) return;
        break;
    } // switch (cmd.commandPerm)

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

    /** @type {string} Key for cool-down */
    const cooldownKey = `${guild.id}.${user.id}.${cmdName}`;

    const setCooldown = cmd.cooldown && userPermissions.setCooldown;

    if (setCooldown) {
      // Is user still in cool-down?
      if (this.cooldowns.get(cooldownKey)) return;
    }
    const now = new Date();

    const cmdContext = {
      client: this,
      guild: guild,
      guildSettings: guildSettings,
      channel: channel,
      message: msg,
      user: user,
      lang: lang,
      commandAliasUsed: cmdAlias,
      commandPrefix: prefix,
      args: parsedArgs,
    };

    Object.assign(cmdContext, userPermissions);

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
          this.log(`✗ ${now.toISOString()} ${cmdName}\n> "${error.message}"\n`);
          console.error(
              '--------------------------------------------------\n',
              `Error executing '${msg.content}'\n`, error,
          );
        });
  }

  /**
   * Handle message
   * @param {Discord.Interaction} interaction
   */
  async onInteractionCreate(interaction) {
    if (
      !interaction.isCommand() &&
      !interaction.isContextMenu()
    ) return;

    if (this.pauseProcess) return;

    const guild = interaction.guild;
    const channel = interaction.channel;
    const user = interaction.user;

    /** @type {GuildSettings|undefined} */
    let guildSettings = undefined;

    let lang;

    // Load guild settings
    if (guild) {
      guildSettings = this.getGuildSettings(guild);
      lang = guildSettings.lang;
    } else {
      lang = this.getUserSettings(user).lang;
    }

    /** Slash command name */
    const slashName = interaction.commandName;

    /** Canonical command name */
    const cmdName =
      this.l10n.getCanonicalName(lang, 'aliases.commands', slashName);

    if (!cmdName) {
      console.error(`Cannot find command named "/${slashName}"`);
      return;
    }

    /** Translation error */
    if (!this.commands.has(cmdName)) {
      console.error(`Cannot find command named "${cmdName}"`);
      return;
    }

    const cmd = this.commands.get(cmdName);

    if (!cmd.slashExecute) {
      console.error(`Cannot find interaction handler for "/${cmdName}"`);
      return;
    }

    /** @type {UserPermissions} */
    const userPermissions =
      this.getUserPermissions(guild, guildSettings, channel, interaction);

    switch (cmd.commandPerm) {
      case COMMAND_PERM.OWNER:
        if (!userPermissions.hasOwnerPermission) return;
        break;
      case COMMAND_PERM.ADMIN:
        if (!userPermissions.hasAdminPermission) return;
        break;
    } // switch (cmd.commandPerm)

    /** @type {string} Key for cool-down */
    const cooldownKey = `${guild.id}.${user.id}.${cmdName}`;

    const setCooldown = cmd.cooldown && userPermissions.setCooldown;

    if (setCooldown) { // Is user still in cool-down?
      if (this.cooldowns.get(cooldownKey)) return;
    }
    const now = new Date();

    /** @type {InteractionContext} */
    const interactionContext = {
      client: this,
      guild: guild,
      guildSettings: guildSettings,
      channel: channel,
      interaction: interaction,
      user: user,
      lang: lang,
    };

    Object.assign(interactionContext, userPermissions);

    cmd.slashExecute(interactionContext)
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
          this.log(`✗ ${now.toISOString()} ${cmdName}\n> "${error.message}"\n`);
          console.error(
              '--------------------------------------------------\n',
              `Error executing '${interaction.content}'\n`, error,
          );
        });
  }

  /**
   * Get ready
   */
  ready() {
    this.on('messageCreate', (msg) => this.onMessageCreate(msg));
    this.on('interactionCreate', (i) => this.onInteractionCreate(i));
  }
}

export default Client;
