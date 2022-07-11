/*
 * Main discord client
 **/

/* eslint max-len: ["error", { "ignoreComments": true }] */

import {existsSync, statSync, mkdirSync} from 'fs';

import {
  Client as djsClient,
  Intents,
  Collection,
  Permissions} from 'discord.js';

import {clientConfig} from './appConfig.js';
import {l10n} from './l10n.js';
import {logger} from './logger.js';
import {servers} from './servers.js';
import {commands} from './commands.js';

import {parseCommandArguments} from '../utils/utils.js';

import {COMMAND_PERM} from './typedef.js';

/**
 * @typedef {import('discord.js')} Discord
 * @typedef {import('discord.js').CommandInteractionOption} CommandInteractionOption
 * @typedef {import('./typedef.js').Command} Command
 * @typedef {import('./typedef.js').UserPermissions} UserPermissions
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').InteractionContext} IContext
 * @typedef {import('./typedef.js').GuildSettings} GuildSettings
 * @typedef {import('./typedef.js').ClientConfig} ClientConfig
 * @typedef {import('./logger.js').LogEntry} LogEntry
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
     * Owner guild id
     * @type {string}
     */
    this.ownerGuildId = clientConfig['owner-server-id'];

    /**
     * Owner role id
     * @type {string}
     */
    this.ownerRoleId = clientConfig['owner-role-id'];

    this.l10n = l10n;

    /**
     * Command Manager
     * @type {CommandManager}
     */
    this.commands = commands;

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
          logger.writeLog(
              'error',
              {
                summary: 'Error accessing the client-data directory: ',
                details: `${this.clientDataPath} is not a directory.`,
              },
          );
          this.clientDataPath = '';
        }
      } else {
        try {
          mkdirSync(this.clientDataPath, {recursive: true});
        } catch (error) {
          logger.writeLog(
              'error',
              'Error creating the client-data directory',
          );
          this.clientDataPath = '';
        }
      }
    }
  } // constructor

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

    if (!guild) return;

    const guildSettings = servers.getSettings(guild);

    const lang =
        guildSettings['lang'] ||
        clientConfig['default-lang'];

    const prefix =
        guildSettings['command-prefix'] ||
        clientConfig['default-prefix'];

    const parsedArgs = parseCommandArguments(prefix, msg.content);

    if (parsedArgs.length == 0) return;

    /** Command alias used */
    const cmdAlias = parsedArgs.shift();

    /** Canonical command name */
    const cmdCanonName =
          l10n.getCanonicalName(lang, 'aliases.commands', cmdAlias);

    if (!cmdCanonName) return;

    /** Translation error */
    if (!this.commands.has(cmdCanonName)) {
      logger.writeLog(
          'error',
          `Command handler for "${cmdAlias}" cannot be found`,
      );
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
      const helpTxt = l10n.getCommandHelp(lang, cmdCanonName);
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
              logger.writeLog(
                  guild.id,
                  {
                    summary: prefix + cmdCanonName,
                    time: execTime,
                  },
              );
            }
          } else {
            logger.writeLog(
                'error',
                {
                  summary: `"${cmdCanonName}" does not return boolean result.`,
                  time: execTime,
                },
            );
          }
        })
        .catch((error) => {
          if (guild) {
            logger.writeLog(
                'error',
                {
                  summary: `Error executing "${msg.content}"`,
                  details: error.stack,
                  time: execTime,
                },
            );
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

    const {guild, channel, user} = interaction;

    const guildSettings = servers.getSettings(guild);
    const lang = guildSettings['lang'] || clientConfig['default-lang'];

    /** Slash command name */
    const slashName = interaction.commandName;
    const cmd = this.commands.find((c) => c.name === slashName);

    if ((!cmd) || (!cmd.slashExecute)) {
      logger.writeLog(
          'error',
          `Command handler for "/${slashName}" cannot be found`,
      );
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
        content: l10n.t(lang, 'messages.no-permission'),
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

            logger.writeLog(
                guild.id,
                {
                  summary: fullCommand,
                  time: execTime,
                },
            );
          } else {
            logger.writeLog(
                'error',
                {
                  summary: `"/${slashName}" does not return boolean result.`,
                  time: execTime,
                },
            );
          }
        })
        .catch((error) => {
          logger.writeLog(
              'error',
              {
                summary: `Error executing ${fullCommand}`,
                details: error.stack,
                time: execTime,
              },
          );
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

      const guildSettings = servers.getSettings(guild);

      guild.members.fetch(user.id)
          .then((member) => {
            const mRoles = member.roles;
            const mPermissions = msg.member.permissions;
            const hasOwnerPermission =
                ((guild.id == this.ownerGuildId) && (this.ownerRoleId))?
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
   * Event handler for joining a new server (register slash commands)
   * @param {Discord.Guild} guild
   */
  async onGuildCreate(guild) {
    logger.writeLog(
        'client',
        `Joined server "${guild.name}" <${guild.id}>`,
    );

    const client = this;
    const bot = await guild.members.fetch(client.user.id);

    // Check bot permission
    const botPermissions = bot.permissions;

    const requiredPermissions = [
      'MANAGE_ROLES',
      'SEND_MESSAGES',
      'SEND_MESSAGES_IN_THREADS',
      'ATTACH_FILES',
      'EMBED_LINKS',
      'READ_MESSAGE_HISTORY',
      'USE_EXTERNAL_EMOJIS',
      'ADD_REACTIONS',
      'USE_APPLICATION_COMMANDS',
    ];

    const missingPermissions = requiredPermissions.filter(
        (p) => (!botPermissions.has(p)),
    );

    if (missingPermissions.length > 0) {
      logger.writeLog(
          'error',
          {
            summary: `Bot is missing some required permissions`,
            details: missingPermissions.join(', '),
          },
      );
      return;
    }

    this.commands.fastDeploy(guild);
  }

  /**
   * Event handler for leaving a server
   * @param {Discord.Guild} guild
   */
  async onGuildLeave(guild) {
    logger.writeLog(
        'client',
        `Left server "${guild.name}" <${guild.id}>`,
    );
  }

  /**
   * Register event handlers and get ready for logging in
   */
  ready() {
    this.on('messageCreate', (msg) => this.onMessageCreate(msg));
    this.on('interactionCreate', (i) => this.onInteractionCreate(i));
    this.on('guildCreate', (g) => this.onGuildCreate(g));
    this.on('guildDelete', (g) => this.onGuildLeave(g));
    this.on('messageReactionAdd', (r, u) => this.onReactionAdd(r, u));
    this.guilds.cache.forEach((g) => logger.openLogBook(g.id));
  }
}

export const client = new Client(clientConfig);
