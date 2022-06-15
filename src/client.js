/*
 * Main client class
 **/

/* eslint max-len: ["error", { "ignoreComments": true }] */

import {
  existsSync,
  statSync,
  mkdirSync} from 'fs';
import {join} from 'path';
import {
  Client as djsClient,
  Intents,
  Collection,
  Permissions} from 'discord.js';

import L10N from './l10n.js';
import CommandManager from './commands.js';
import LogManager from './log-manager.js';

import {saveCollectionToFile, createCollectionFromFile, parseCommandArguments}
  from '../utils/utils.js';

import {COMMAND_PERM} from './typedef.js';

/**
 * @typedef {import('discord.js')} Discord
 * @typedef {import('discord.js').CommandInteractionOption} CommandInteractionOption
 * @typedef {import('./typedef.js').Command} Command
 * @typedef {import('./typedef.js').UserPermissions} UserPermissions
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').InteractionContext} IContext
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
    this.commands = new CommandManager(this);

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

      /** @type {LogManager} */ this.logManager = new LogManager(this);
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
   * @param {string} key - Setting key
   * @param {string|string[]} value - New value
   */
  updateGuildSettings(guild, key, value) {
    const settings = this.getGuildSettings(guild);
    settings[key] = value;
    this.guildConfig.set(guild.id, settings);
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
   * Write command execution log
   * @param {string} guildId - Guild Id
   * @param {string} log - Entry text
   * @param {Date} [time] - Entry time
   */
  commandLog(guildId, log, time) {
    if (this.logManager) this.logManager.writeLog(guildId, log, time);
  }

  /**
   * Write general log
   * @param {string} log - Entry text
   * @param {Date} [time] - Entry time
   */
  log(log, time) {
    if (this.logManager) this.logManager.writeLog('log', log, time);
  }

  /**
   * Write error log
   * @param {string} log - Entry text
   * @param {Date} [time] - Entry time
   */
  errorLog(log, time) {
    if (this.logManager) this.logManager.writeLog('error', log, time);
  }

  /**
   * Get user permissions
   * @param {Discord.Guild} guild
   * @param {GuildSettings} guildSettings
   * @param {Discord.Channel} channel
   * @param {Discord.GuildMember} member
   * @return {UserPermissions}
   */
  getUserPermissions(guild, guildSettings, channel, member) {
    if (channel.type === 'GUILD_TEXT') {
      const mRoles = member.roles;
      const mPermissions = member.permissions;

      const hasOwnerPermission =
          (guild.id == this.ownerGuildId) &&
          this.ownerRoleId?
          mRoles.cache.some((r)=>r.id = this.ownerRoleId):
          mPermissions.has(Permissions.FLAGS.ADMINISTRATOR);

      const adminRoles = guildSettings['admin-roles'] || [];
      const hasAdminPermission =
          ((adminRoles.length) &&
            (mRoles.cache.some((r)=> adminRoles.includes(r.id)))) ||
          mPermissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
          mPermissions.has(Permissions.FLAGS.MANAGE_GUILD);

      const modRoles = guildSettings['mod-roles'] || [];
      const userIsMod = (modRoles.length)?
          mRoles.cache.some((r)=>modRoles.includes(r.id)):false;

      const helperRoles = guildSettings['helper-roles'] || [];
      const userIsHelper = (helperRoles.length)?
        mRoles.cache.some((r)=>helperRoles.includes(r.id)):false;

      const noCooldown =
        hasOwnerPermission || hasAdminPermission ||
        userIsMod || userIsHelper ||
        (channel.id == guildSettings['bot-channel']);

      return {
        hasOwnerPermission: hasOwnerPermission,
        hasAdminPermission: hasAdminPermission,
        userIsMod: userIsMod,
        userIsHelper: userIsHelper,
        applyCooldown: !noCooldown,
      };
    } else {
      return {
        hasOwnerPermission: false,
        hasAdminPermission: false,
        userIsMod: false,
        userIsHelper: false,
        applyCooldown: false,
      };
    }
  }

  /**
   * Process text command
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
      lang = guildSettings['lang']||this.l10n.defaultLang;
      prefix = guildSettings['command-prefix']||this.defaultPrefix;
    } else {
      lang = this.getUserSettings(user).lang;
      prefix = this.defaultPrefix;
    }

    const parsedArgs = parseCommandArguments(prefix, msg.content);

    if (parsedArgs.length == 0) return;

    /** Command alias used */
    const cmdAlias = parsedArgs.shift();

    /** Canonical command name */
    const cmdCanonName =
      this.l10n.getCanonicalName(lang, 'aliases.commands', cmdAlias);

    if (!cmdCanonName) return;

    /** Translation error */
    if (!this.commands.has(cmdCanonName)) {
      this.errorLog(`Cannot find command named "${cmdCanonName}"`);
      return;
    }

    const cmd = this.commands.get(cmdCanonName);

    if (!cmd.execute) return; // Application (/) command only

    /** @type {UserPermissions} */
    const userPermissions = this.getUserPermissions(
        guild,
        guildSettings,
        channel,
        msg.member,
    );

    switch (cmd.commandPerm) {
      case COMMAND_PERM.OWNER:
        if (!userPermissions.hasOwnerPermission) return;
        break;
      case COMMAND_PERM.ADMIN:
        if (!userPermissions.hasAdminPermission) return;
        break;
    } // switch (cmd.commandPerm)

    if ((cmd.requireArgs) && (parsedArgs.length == 0)) {
      const helpTxt = this.l10n.getCommandHelp(lang, cmdCanonName);
      if (helpTxt) {
        channel.send({
          content: helpTxt.replaceAll('?', prefix),
          reply: {messageReference: msg.id},
        });
      }
      return;
    }

    const applyCooldown = cmd.cooldown && userPermissions.applyCooldown;

    /** @type {string} Key for cool-down */
    let cooldownKey = '';

    if (applyCooldown) {
      cooldownKey = `${guild.id}.${user.id}.${cmdCanonName}`;
      if (this.cooldowns.has(cooldownKey)) return; // User is in cool-down
    }

    /** Execution time */ const execTime = new Date();

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
            if (result && applyCooldown) {
              const cooldownMS = cmd.cooldown * 1000;
              const expiration = execTime.valueOf() + cooldownMS;
              this.cooldowns.set(cooldownKey, expiration);
              setTimeout(() => this.cooldowns.delete(cooldownKey), cooldownMS);
            }
            if (guild) {
              this.commandLog(
                  guild.id,
                  cmdCanonName,
                  execTime,
              );
            }
          } else {
            this.errorLog(
                `"${cmdCanonName}" does not return boolean result.`,
                execTime,
            );
          }
        })
        .catch((error) => {
          if (guild) {
            const errorMessage =
                `Error executing "${msg.content}"\n` +
                `"${error.message}"\n` +
                '--------------------------------------------------\n' +
                error;

            this.errorLog(errorMessage, execTime);
          }
        });
  }

  /**
   * Process slash command
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
      lang = guildSettings['lang']||this.l10n.defaultLang;
    } else {
      lang = this.getUserSettings(user).lang;
    }

    /** Slash command name */
    const slashName = interaction.commandName;
    const cmd = this.commands.find((c) => c.name === slashName);

    if ((!cmd) || (!cmd.slashExecute)) {
      this.errorLog(`Cannot execute "/${slashName}"`);
      return;
    }

    /**
      * Convert command interaction options to an array
      * @param {string[]} result - initial array
      * @param {CommandInteractionOption[]} options - command options
      * @return {string[]}
      */
    function arrayFromOptions(result, options) {
      return options.reduce((res, opt) => {
        if (opt.type === 'SUB_COMMAND') {
          return arrayFromOptions(res.concat(opt.name), opt.options);
        } else {
          return res.concat(`${opt.name}:"${opt.value}"`);
        }
      }, result);
    }

    const fullCommand =
      arrayFromOptions([`/${slashName}`], interaction.options.data).join(' ');

    /** @type {UserPermissions} */
    const userPermissions = this.getUserPermissions(
        guild,
        guildSettings,
        channel,
        interaction.member,
    );

    if (
      (
        (cmd.commandPerm === COMMAND_PERM.OWNER) &&
        (!userPermissions.hasOwnerPermission)
      ) || (
        (cmd.commandPerm === COMMAND_PERM.ADMIN) &&
        (!userPermissions.hasAdminPermission)
      )
    ) {
      interaction.reply({
        content: this.l10n.t(lang, 'messages.no-permission'),
        ephemeral: true,
      });
      return;
    }

    /** @type {string} Key for cool-down */
    const cooldownKey = `${guild.id}.${user.id}.${cmd.canonName}`;

    const applyCooldown = cmd.cooldown && userPermissions.applyCooldown;

    if (applyCooldown) { // Is user still in cool-down?
      if (this.cooldowns.get(cooldownKey)) return;
    }

    /** Execution time       */ const execTime = new Date();

    /** @type {IContext} */
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
            if (result && applyCooldown) {
              const cooldownMS = cmd.cooldown * 1000;
              const expiration = execTime.valueOf() + cooldownMS;
              this.cooldowns.set(cooldownKey, expiration);
              setTimeout(() => this.cooldowns.delete(cooldownKey), cooldownMS);
            }
            this.commandLog(
                guild.id,
                fullCommand,
                execTime,
            );
          } else {
            console.error(`"/${slashName}" does not return boolean result.`);
          }
        })
        .catch((error) => {
          const errorMessage =
              `Error executing ${fullCommand}\n` +
              `"${error.message}"\n` +
              '--------------------------------------------------\n' +
              error;

          this.errorLog(errorMessage, execTime);
        });
  }

  /**
   * Process waste bin reaction (🗑️) for deleting bot's own message
   * @param {Discord.MessageReaction} reaction
   * @param {Discord.User} user
   */
  async onReactionAdd(reaction, user) {
    if (this.pauseProcess) return;
    const {client, message} = reaction;

    message.fetch().then((msg) => {
      const {guild} = msg;

      if (!guild) return;

      const authorId = msg?.author?.id || undefined;

      if (authorId !== client.user.id) return;

      if (reaction.emoji.name !== '🗑️') return;

      const guildSettings = this.getGuildSettings(guild);

      guild.members.fetch(user.id)
          .then((member) => {
            const mRoles = member.roles;
            const mPermissions = msg.member.permissions;
            const hasOwnerPermission =
                (guild.id == this.ownerGuildId) &&
                this.ownerRoleId?
                mRoles.cache.some((r)=>r.id = this.ownerRoleId):
                mPermissions.has(Permissions.FLAGS.ADMINISTRATOR);

            const adminRoles = guildSettings['admin-roles'] || [];
            const hasAdminPermission =
                (
                  (adminRoles.length) &&
                  (mRoles.cache.some((r)=> adminRoles.includes(r.id)))
                ) ||
                mPermissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
                mPermissions.has(Permissions.FLAGS.MANAGE_GUILD);

            const modRoles = guildSettings['mod-roles'] || [];
            const userIsMod = (modRoles.length)?
                mRoles.cache.some((r)=>modRoles.includes(r.id)):false;

            const helperRoles = guildSettings['helper-roles'] || [];
            const userIsHelper = (helperRoles.length)?
              mRoles.cache.some((r)=>helperRoles.includes(r.id)):false;

            if (
              hasOwnerPermission || hasAdminPermission ||
              userIsMod || userIsHelper
            ) {
              msg.delete();
            }
          });
    });
  }

  /**
   * Register slash commands when joining a new server
   * @param {Discord.Guild} guild
   */
  async onGuildCreate(guild) {
    this.log(`Joined server "${guild.name}" <${guild.id}>`);
    this.commands.fastDeploy(guild);
  }

  /**
   * Get ready
   */
  ready() {
    this.on('messageCreate', (msg) => this.onMessageCreate(msg));
    this.on('interactionCreate', (i) => this.onInteractionCreate(i));
    this.on('guildCreate', (g) => this.onGuildCreate(g));
    this.on('guildDelete', (g) => this.log(`Left server <${g.id}>`));
    this.on('messageReactionAdd', (r, u) => this.onReactionAdd(r, u));
  }
}
export default Client;
