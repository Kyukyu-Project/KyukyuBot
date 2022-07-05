/**
 * @typedef {import('../../src/typedef.js').DeploymentContext} DeploymentContext
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import {ChannelType} from 'discord-api-types/v10';

import {l10n} from '../../src/l10n.js';
import {getChannelId} from '../../utils/utils.js';

export const canonName = 'admin.bot-channel';
export const name = 'bot-channel';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

const settingKey = 'bot-channel';

const INFO_DESC           = `commands.${canonName}.info-desc`;
const INFO_ONE            = `commands.${canonName}.info-one`;
const INFO_NONE           = `commands.${canonName}.info-none`;
const ERROR_CLEAR         = `commands.${canonName}.error-clear`;
const ERROR_SET           = `commands.${canonName}.error-set`;
const SET_SUCCESS         = `commands.${canonName}.set-success`;
const CLEAR_SUCCESS       = `commands.${canonName}.clear-success`;
const INVALID_COMMAND     = `messages.invalid-command`;
const scInfoLabel  = 'info';
const scSetLabel   = 'set';
const scClearLabel = 'clear';
const optChannelLabel = 'channel';
const fInfo               = ['--info', '-i'];
const fSet                = ['--set', '-s'];
const fClear              = ['--clear', '-c'];

/**
 * @param {DeploymentContext} context
 * @return {SlashCommandBuilder}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const scInfoHint = l10n.s(lang, `commands.${canonName}.sc-info-hint`);
  const scSetHint = l10n.s(lang, `commands.${canonName}.sc-set-hint`);
  const scClearHint = l10n.s(lang, `commands.${canonName}.sc-clear-hint`);
  const optChannelHint = l10n.s(lang, `commands.${canonName}.opt-channel-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addSubcommand((c) => c.setName(scInfoLabel).setDescription(scInfoHint))
      .addSubcommand((c) => c.setName(scSetLabel).setDescription(scSetHint)
          .addChannelOption((option) => option
              .setName(optChannelLabel)
              .setDescription(optChannelHint)
              .setRequired(true)
              .addChannelType(ChannelType.GuildText),
          ),
      )
      .addSubcommand((c) => c
          .setName(scClearLabel)
          .setDescription(scClearHint),
      );
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {lang, interaction} = context;

  if (context.hasAdminPermission) {
    const subCommand = interaction.options.getSubcommand();
    let result;
    switch (subCommand) {
      case scSetLabel:
        const newChannelId = interaction.options.getChannel(optChannelLabel).id;
        result = set(context, newChannelId);
        break;
      case scClearLabel:
        result = clear(context);
        break;
      case scInfoLabel:
      default:
        result = view(context);
    }
    interaction.reply({content: result.response, ephemeral: true});
    return result.success;
  }
  const response = l10n.s(lang, 'messages.no-permission');
  interaction.reply({content: response, ephemeral: true});
  return false;
}

/**
 * @param {CommandContext} context
 * @param {string|null} newId - id of new bot-command channel
 * @return {ActionResult}
 */
function set(context, newId) {
  const {client, lang, guild, guildSettings} = context;
  const l10n = client.l10n;
  const prevId = guildSettings['bot-channel'] || null;
  if (newId) {
    if (prevId == newId) { // already the bot channel
      return {
        response: l10n.t(lang, ERROR_SET, '{CHANNEL}', `<#${newId}>`),
        success: false,
      };
    } else if (guild.channels.cache.get(newId)?.isText()) { // set
      client.updateGuildSettings(guild, settingKey, newId);
      client.commands.slowDeploy(guild);
      return {
        response: l10n.t(lang, SET_SUCCESS, '{CHANNEL}', `<#${newId}>`),
        success: true,
      };
    }
  }
  return {
    response: l10n.s(lang, INVALID_COMMAND),
    success: false,
  };
}

/**
 * @param {CommandContext|IContext} context
 * @param {string|null} prevId
 * @return {ActionResult}
 */
function clear(context) {
  const {client, lang, guild, guildSettings} = context;
  const l10n = client.l10n;
  const currId = guildSettings['bot-channel'] || null;

  if (typeof currId === 'string') {
    client.updateGuildSettings(guild, settingKey, '');
    client.commands.slowDeploy(guild);
    return {
      response: l10n.t(lang, CLEAR_SUCCESS, '{CHANNEL}', `<#${currId}>`),
      success: true,
    };
  } else {
    return {
      response: l10n.s(lang, ERROR_CLEAR),
      success: false,
    };
  }
}

/**
 * @param {CommandContext} context
 * @return {ActionResult}
 */
function view(context) {
  const {client, lang, guildSettings} = context;
  const l10n = client.l10n;
  const currId = guildSettings[settingKey] || null;

  const response =
      l10n.s(lang, INFO_DESC) + (
        (currId)?
        l10n.t(lang, INFO_ONE, '{CHANNEL}', `<#${currId}>`):
        l10n.s(lang, INFO_NONE)
      );

  return {
    response: response,
    success: true,
  };
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {channel, message, args} = context;
  /** @type {ActionResult} */ let actionResult;

  if (args.length == 0) {
    actionResult = view(context);
  } else {
    const firstArg = args[0].toLowerCase();
    if (fInfo.includes(firstArg)) {
      actionResult = view(context);
    } else if (fClear.includes(firstArg)) {
      actionResult = clear(context);
    } else if (fSet.includes(firstArg) && (args.length > 1)) {
      actionResult = set(context, getChannelId(args[1]));
    } else {
      actionResult = view(context);
    }
  }

  channel.send({
    content: actionResult.response,
    reply: {messageReference: message.id},
  });
  return actionResult.success;
}
