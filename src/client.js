/*
 * Main discord client
 **/

/**
 * @typedef {import('discord.js')} Discord
 * @typedef {import('./typedef.js').CommandHandler} CommandHandler
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').CommandContext} CommandContext
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
// import {l10n} from './l10n.js';
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
   * Execute an application command
   * @param {Discord.Interaction} interaction
   */
  async runCommand(interaction) {
    const {commandName, locale, guild, channel, user} = interaction;
    const cmd = commands.getCommand(commandName);

    if ((!cmd) || (!cmd.execute)) {
      logger.writeLog(
          'client.error',
          `Command handler for "/${commandName}" cannot be found`,
      );
      return;
    }

    let cooldown = 0;
    let cooldownKey = undefined;
    let guildSettings = undefined;

    let userIsHelper = false;
    let userIsAdmin = false;

    if (channel.type === ChannelType.GuildText) {
      const mRoles = interaction.member.roles;
      const mPermissions = interaction.member.permissions;

      guildSettings = servers.getSettings(guild);
      const helperRoles = guildSettings['helper-roles'] || [];

      userIsAdmin =
        (mPermissions.has(PermissionFlagsBits.Administrator)) ||
        (mPermissions.has(PermissionFlagsBits.ManageGuild));

      userIsHelper = (
        (helperRoles.length) &&
        (mRoles.cache.some((r)=>helperRoles.includes(r.id)) )
      );

      if (cmd.cooldown) {
        if (
          userIsAdmin ||
          userIsHelper ||
          (channel.id == guildSettings['bot-channel'])
        ) {
          // no cool down
        } else {
          cooldown = cmd.cooldown;
        }

        if (cooldown) {
          cooldownKey = `${guild.id}.${user.id}.${commandName}`;
          // Exit if user is still in cool-down
          if (this.cooldownMap.get(cooldownKey)) return;
        }
      }
    }

    const fullCommand = getFullSlashCommand(interaction);
    const execTime = new Date();

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
    };

    cmd.execute(commandContext)
        .then((result) => {
          if (typeof result == 'boolean') {
            if (result && cooldown) {
              const cooldownMS = cooldown * 1000;
              const expiration = execTime.valueOf() + cooldownMS;
              this.cooldownMap.set(cooldownKey, expiration);
              setTimeout(
                  () => this.cooldownMap.delete(cooldownKey),
                  cooldownMS,
              );
            }

            logger.writeLog(
                `${guild.id}.log`,
                {
                  summary: fullCommand,
                  time: execTime,
                },
            );
          } else {
            logger.writeLog(
                'client.error',
                {
                  summary: `"/${commandName}" does not return boolean result.`,
                  time: execTime,
                },
            );
          }
        })
        .catch((error) => {
          logger.writeLog(
              'client.error',
              {
                summary: `Error executing ${fullCommand}`,
                details: error.stack,
                time: execTime,
              },
          );
        });
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
    this.on('interactionCreate', (i) => this.onInteractionCreate(i));
    this.on('guildCreate', (g) => this.onGuildCreate(g));
    this.on('guildDelete', (g) => this.onGuildLeave(g));
    this.on('messageReactionAdd', (r, u) => this.onReactionAdd(r, u));
  }
}

export const client = new Client(clientConfig);
