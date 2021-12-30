/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../src/typedef.js';

export const canonName = 'admin.bot-channel';
export const name = 'bot-channel';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.ADMIN;
export const cooldown = 0;

import {getChannelId} from '../../utils/utils.js';

const SHOW_BOT_CHANNEL    = `commands.${canonName}.show-bot-channel`;
const NO_BOT_CHANNEL      = `commands.${canonName}.no-bot-channel`;
const ALREADY_BOT_CHANNEL = `commands.${canonName}.already-the-bot-channel`;
const SET_SUCCESS         = `commands.${canonName}.set-success`;
const UNSET_SUCCESS       = `commands.${canonName}.unset-success`;
const INVALID_COMMAND     = `messages.invalid-command`;
const VIEW_FLAGS          = `commands.${canonName}.flags.view`;
const SET_FLAGS           = `commands.${canonName}.flags.set`;
const UNSET_FLAGS         = `commands.${canonName}.flags.unset`;

/**
 * @param {CommandContext} context
 * @param {string|null} prevId
 * @param {string|null} newId
 * @return {boolean}
 */
function set(context, prevId, newId) {
  const {client, lang, guild, guildSettings, channel, message} = context;
  const l10n = client.l10n;
  let response;
  let result = false;

  if (newId) {
    if (prevId == newId) { // already the bot channel
      response = l10n.t(lang, ALREADY_BOT_CHANNEL, '{CHANNEL}', `<#${newId}>`);
    } else if (guild.channels.cache.get(newId)?.isText()) { // set
      response = l10n.t(lang, SET_SUCCESS, '{CHANNEL}', `<#${newId}>`);
      guildSettings['bot-channel'] = newId;
      client.updateGuildSettings(guild, guildSettings);
      result = true;
    } else { // invalid
      response = l10n.s(lang, INVALID_COMMAND);
    }
  } else {
    response = l10n.s(lang, INVALID_COMMAND);
  }

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return result;
}

/**
 * @param {CommandContext} context
 * @param {string|null} prevId
 * @return {boolean}
 */
function unset(context, prevId) {
  const {client, lang, guild, guildSettings, channel, message} = context;
  const l10n = client.l10n;
  let response;
  let result = false;

  if (typeof prevId == 'string') {
    response = l10n.t(lang, UNSET_SUCCESS, '{CHANNEL}', `<#${prevId}>`);
    guildSettings['bot-channel'] = '';
    client.updateGuildSettings(guild, guildSettings);
    result = true;
  } else {
    response = l10n.s(lang, NO_BOT_CHANNEL);
  }

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return result;
}

/**
 * @param {CommandContext} context
 * @param {string|null} prevId
 * @return {boolean}
 */
function view(context, prevId) {
  const {client, lang, channel, message} = context;
  const l10n = client.l10n;

  const response =
      (prevId)?
      l10n.t(lang, SHOW_BOT_CHANNEL, '{CHANNEL}', `<#${prevId}>`):
      l10n.s(lang, NO_BOT_CHANNEL);

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return true;
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {client, lang, guildSettings, args} = context;
  const l10n = client.l10n;
  const prevId = guildSettings['bot-channel'] || null;

  if (args.length == 0) return view(context, prevId);

  const firstArg = args[0].toLowerCase();
  const viewFlags = l10n.s(lang, VIEW_FLAGS);
  const setFlags = l10n.s(lang, SET_FLAGS);
  const unsetFlags = l10n.s(lang, UNSET_FLAGS);

  if (viewFlags.includes(firstArg)) return view(context, prevId);
  if (unsetFlags.includes(firstArg)) return unset(context, prevId);
  if (setFlags.includes(firstArg) && (args.length > 1)) {
    const newId = getChannelId(args[1]);
    return set(context, prevId, newId);
  }
  return set(context, prevId, getChannelId(firstArg));
}
