/*
 * Main discord client
 **/

/**
 * @typedef {import('discord.js')} Discord
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').Interaction} Interaction
 * @typedef {import('./typedef.js').CommandHandler} CommandHandler
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').MessageContext} MessageContext
 * @typedef {import('./typedef.js').GuildSettings} GuildSettings
 * @typedef {import('./typedef.js').ClientConfig} ClientConfig
 * @typedef {import('./logger.js').LogEntry} LogEntry
 */

/* eslint max-len: ["error", { "ignoreComments": true }] */

import {
  Client as djsClient,
  InteractionType,
  ChannelType,
  PermissionFlagsBits,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from 'discord.js';

import {clientConfig} from './app-config.js';
import {l10n} from './l10n.js';
import {logger} from './logger.js';
import {servers} from './servers.js';
import {commands} from './commands.js';
import {noop, getFullSlashCommand} from './utils.js';


/** Extending Discord Client */
class Client extends djsClient {
  /**
   * @param {ClientConfig} clientConfig
   */
  constructor(clientConfig) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
      ],
    });

    /**
     * Owner guild id
     * @type {string}
     */
    this.ownerGuildId = clientConfig['owner-server-id'];

    /**
     * Container for all cooldown
     */
    this.cooldownMap = new Map();

    /**
     * Flag for pausing all commands
     * @type {boolean}
     */
    this.pauseProcess = false;

    /**
     * List of all servers
     * @type {string[]}
     */
    this.servers = [];
    this.fetchServers();
  } // constructor

  /**
   * Get context of an interaction
   * @param {Interaction} interaction
   * @param {CommandHandler} cmd
   * @return {CommandContext}
   */
  getCommandContext(interaction, cmd) {
    const {commandName, locale, guild, channel, user} = interaction;

    let cooldown = 0;
    let cooldownKey = undefined;
    let guildSettings = undefined;

    let userIsHelper = false;
    let userIsAdmin = false;

    let inBotChannel = false;

    if (channel.type === ChannelType.GuildText) {
      guildSettings = servers.getSettings(guild);

      const mPermissions = interaction.member.permissions;
      userIsAdmin =
        (mPermissions.has(PermissionFlagsBits.Administrator)) ||
        (mPermissions.has(PermissionFlagsBits.ManageGuild));

      const helperRoles = guildSettings['helper-roles'] || [];
      const mRoleCache = interaction.member.roles.mRoles.cache;
      userIsHelper = (
        (helperRoles.length) &&
        (mRoleCache.some((r) => helperRoles.includes(r.id)) )
      );

      inBotChannel = (channel.id == guildSettings['bot-channel']);

      if (cmd.cooldown) {
        if (!userIsAdmin && !userIsHelper && !inBotChannel) {
          cooldown = cmd.cooldown;
          cooldownKey = `${guild.id}.${user.id}.${commandName}`;
        }
      }
    }

    /** @type {CommandContext} */
    const commandContext = {
      client: this,
      guild: guild,
      guildSettings: guildSettings,
      channel: channel,
      interaction: interaction,
      user: user,
      locale: locale,
      userIsAdmin: userIsAdmin,
      userIsHelper: userIsHelper,
      cooldown: cooldown,
      cooldownKey: cooldownKey,
      inBotChannel: inBotChannel,
      time: new Date(),
    };

    return commandContext;
  }

  /**
   * Get context of a message
   * @param {Message} message
   * @return {MessageContext}
   */
  getMessageContext(message) {
    const {guild, channel} = message;

    const commandName = 'info';
    const cooldown = 5;

    const user = message.author;

    let locale = 'en-US';

    let cooldownKey = undefined;
    let guildSettings = undefined;

    let userIsHelper = false;
    let userIsAdmin = false;

    let inBotChannel = false;

    if (channel.type === ChannelType.GuildText) {
      locale = message.guild.preferredLocale;

      guildSettings = servers.getSettings(guild);

      const mPermissions = message.member.permissions;
      userIsAdmin =
        (mPermissions.has(PermissionFlagsBits.Administrator)) ||
        (mPermissions.has(PermissionFlagsBits.ManageGuild));

      const helperRoles = guildSettings['helper-roles'] || [];
      const mRoleCache = message.member.roles.cache;
      userIsHelper = (
        (helperRoles.length) &&
        (mRoleCache.some((r) => helperRoles.includes(r.id)) )
      );

      inBotChannel = (channel.id == guildSettings['bot-channel']);

      if (!userIsAdmin && !userIsHelper && !inBotChannel) {
        cooldownKey = `${guild.id}.${user.id}.${commandName}`;
      }
    }

    /** @type {CommandContext} */
    const commandContext = {
      client: this,
      guild: guild,
      guildSettings: guildSettings,
      channel: channel,
      message: message,
      user: user,
      locale: locale,
      userIsAdmin: userIsAdmin,
      userIsHelper: userIsHelper,
      cooldown: cooldown,
      cooldownKey: cooldownKey,
      inBotChannel: inBotChannel,
      time: new Date(),
    };

    return commandContext;
  }

  /**
   * Execute an application command
   * @param {Discord.Interaction} interaction
   */
  async runCommand(interaction) {
    const {commandName} = interaction;
    const cmd = commands.getCommand(commandName);

    if ((!cmd) || (!cmd.execute)) {
      logger.writeLog(
          'client.error',
          `Command handler for "/${commandName}" cannot be found`,
      );
      return;
    }

    const ctx = this.getCommandContext(interaction, cmd);

    if (this.checkCooldown(ctx)) return;

    cmd
        .execute(ctx)
        .then((res) => this.logCommandResult(res, ctx))
        .catch((err) => this.logCommandError(err, ctx));
  }

  /**
   * Log result of an application command
   * @param {boolean} result - Command result
   * @param {CommandContext} ctx - Command context
   */
  logCommandResult(result, ctx) {
    const {commandName, guild, interaction, time} = ctx;

    if (typeof result == 'boolean') {
      logger.writeLog(
          `${guild.id}.log`,
          {
            summary: getFullSlashCommand(interaction),
            time: time,
          },
      );

      if (result) this.setCooldown(ctx);
    } else {
      logger.writeLog(
          'client.error',
          {
            summary: `"/${commandName}" does not return boolean result.`,
            time: time,
          },
      );
    }
  }

  /**
   * Log error of an application command
   * @param {Error} error - Command result
   * @param {CommandContext} ctx - Command context
   */
  logCommandError(error, ctx) {
    const {interaction, time} = ctx;

    logger.writeLog(
        'client.error',
        {
          summary: `Error executing ${getFullSlashCommand(interaction)}`,
          details: error.stack,
          time: time,
        },
    );
  }

  /**
   * Set cooldown
   * @param {CommandContext} ctx - Command context
   */
  setCooldown(ctx) {
    const {cooldownKey, cooldown, time} = ctx;
    if (ctx.cooldown) {
      const cooldownMS = cooldown * 1000;
      const expiration = time.valueOf() + cooldownMS;
      this.cooldownMap.set(cooldownKey, expiration);
      setTimeout(() => this.cooldownMap.delete(cooldownKey), cooldownMS);
    }
  }

  /**
   * Is the user on cooldown?
   * @param {CommandContext} ctx - Command context
   * @return {boolean}
   */
  checkCooldown(ctx) {
    const {cooldownKey, cooldown} = ctx;
    return (cooldown) && (this.cooldownMap.has(cooldownKey));
  }

  /**
   * Execute command autocomplete function
   * @param {Discord.Interaction} interaction
   */
  async runAutocomplete(interaction) {
    const {commandName, locale, guild, channel, user} = interaction;
    const cmd = commands.getCommand(commandName);

    if ((!cmd) || (!cmd.autocomplete)) {
      logger.writeLog(
          'client.error',
          `Autocomplete handler for "/${commandName}" cannot be found`,
      );
      return;
    }

    let guildSettings = undefined;

    if (channel.type === ChannelType.GuildText) {
      guildSettings = servers.getSettings(guild);
    }

    /** @type {CommandContext} */
    const commandContext = {
      client: this,
      guild: guild,
      guildSettings: guildSettings,
      channel: channel,
      interaction: interaction,
      user: user,
      locale: locale,
    };

    cmd.autocomplete(commandContext);
  }

  /**
   * Process interaction
   * @param {Discord.Interaction} interaction
   */
  async onInteractionCreate(interaction) {
    if (this.pauseProcess) return;

    if (interaction.type === InteractionType.ApplicationCommand) {
      this.runCommand(interaction);
    } else
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      this.runAutocomplete(interaction);
    } else
    if (interaction.isMessageContextMenuCommand() ) {
      //
    }
  }

  /**
   * Process message
   * @param {Discord.Message} message
   */
  async onMessageCreate(message) {
    const {client, channel} = message;

    if (this.pauseProcess) return;
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
      const ctx = this.getMessageContext(message);

      if (this.checkCooldown(ctx)) return;

      const query = String(message.content).toLowerCase();
      const infoResult = l10n
          .autocomplete
          .getContent(ctx.locale, query, 'cmd-info');

      if (infoResult) {
        if (infoResult.embeds) {
          channel.send({
            embeds: infoResult.embeds,
            reply: {messageReference: message.id},
          });
          return true;
        }
      }

      this.setCooldown(ctx);
    }
  }

  /**
   * Process waste bin reaction (🗑️) for deleting bot's own message
   * @param {Discord.MessageReaction} reaction
   * @param {Discord.User} user
   */
  async onReactionAdd(reaction, user) {
    if (this.pauseProcess) return;
    const {message} = reaction;

    message
        .fetch()
        .then((msg) => {
          const authorId = msg?.author?.id || undefined;
          if (authorId !== this.user.id) return;

          const {guild, channel} = msg;

          if (reaction.emoji.name !== '🗑️') return;

          if (!guild) {
            msg.delete();
            return;
          }

          if (channel.type === ChannelType.GuildText) {
            const guildSettings = servers.getSettings(guild);
            const helperRoles = guildSettings['helper-roles'] || [];
            guild.members
                .fetch(user.id)
                .then((member) => {
                  const mRoles = member.roles;
                  const mPermissions = member.permissions;
                  if (
                    (mPermissions.has(PermissionFlagsBits.Administrator)) ||
                    (mPermissions.has(PermissionFlagsBits.ManageGuild)) ||
                    (
                      (helperRoles.length) &&
                      (mRoles.cache.some((r)=>helperRoles.includes(r.id)) )
                    )
                  ) msg.delete();
                });
          }
        })
        .catch(noop); // message deleted
  }

  /**
   * Event handler for joining a new server
   * @param {Discord.Guild} guild
   */
  async onGuildCreate(guild) {
    logger.writeLog(
        'client.log',
        `Joined server "${guild.name}" <${guild.id}>`,
    );
  }

  /**
   * Event handler for leaving a server
   * @param {Discord.Guild} guild
   */
  async onGuildLeave(guild) {
    logger.writeLog(
        'client.log',
        `Left server "${guild.name}" <${guild.id}>`,
    );
  }

  /**
   * Get a list of all servers the bot is on
   */
  fetchServers() {
    const botClient = this;

    new REST({version: '10'})
        .setToken(clientConfig['login-token'])
        .get(Routes.userGuilds())
        .then((guilds) => {
          botClient.servers = guilds.map((g) => ({id: g.id, name: g.name}));
        });
  }

  /**
   * Register event handlers and get ready for logging in
   */
  async ready() {
    this.on('messageCreate', (msg) => this.onMessageCreate(msg));
    this.on('interactionCreate', (i) => this.onInteractionCreate(i));
    this.on('guildCreate', (g) => this.onGuildCreate(g));
    this.on('guildDelete', (g) => this.onGuildLeave(g));
    this.on('messageReactionAdd', (r, u) => this.onReactionAdd(r, u));
  }
}

export const client = new Client(clientConfig);
