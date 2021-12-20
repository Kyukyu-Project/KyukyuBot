/**
* @typedef {import('../../typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../typedef.js';

export const name = 'admin.set-bot-channel';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.ADMIN;

import {getChannelId} from '../../utils/utils.js';

const SHOW_BOT_CHANNEL    = `commands.${name}.show-bot-channel`;
const NO_BOT_CHANNEL      = `commands.${name}.no-bot-channel`;
const ALREADY_BOT_CHANNEL = `commands.${name}.already-the-bot-channel`;
const COMMAND_SUCCESS     = `commands.${name}.success`;
const NOT_TEXT_CHANNEL    = `commands.${name}.not-a-text-channel`;

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {client, lang, guild, guildSettings} = context;
  const l10n = client.l10n;

  let response;
  let result = false;
  const prevId = guildSettings['bot-channel'] || '';
  const newId = getChannelId(context.args[0]);

  if (!newId) { // show bot channel
    if (prevId) {
      response = l10n.t(lang, SHOW_BOT_CHANNEL, '{CHANNEL}', `<#${prevId}>`);
      result = true;
    } else {
      response = l10n.s(lang, NO_BOT_CHANNEL);
    }
  } else if (prevId == newId) { // already the bot channel
    response = l10n.t(lang, ALREADY_BOT_CHANNEL, '{CHANNEL}', `<#${newId}>`);
  } else if (guild.channels.cache.get(newId)?.isText()) { // set
    response = l10n.t(lang, COMMAND_SUCCESS, '{CHANNEL}', `<#${newId}>`);
    guildSettings['bot-channel'] = newId;
    client.updateGuildSettings(guild, guildSettings);
    result = true;
  } else { // invalid
    response = l10n.t(lang, NOT_TEXT_CHANNEL, '{CHANNEL}', `<#${newId}>`);
  }
  context.channel.send({
    content: response,
    reply: {messageReference: context.message.id},
  });
  return result;
}
