
/**
* @typedef {import('../../typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../typedef.js';

export const name = 'admin.unset-bot-channel';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.ADMIN;

const COMMAND_SUCCESS     = `commands.${name}.success`;
const NO_BOT_CHANNEL      = `commands.${name}.no-bot-channel`;

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

  if (prevId) {
    response = l10n.t(lang, COMMAND_SUCCESS, '{CHANNEL}', `<#${prevId}>`);
    guildSettings['bot-channel'] = '';
    client.updateGuildSettings(guild, guildSettings);
    result = true;
  } else {
    response = l10n.s(lang, NO_BOT_CHANNEL);
  }

  context.channel.send({
    content: response,
    reply: {messageReference: context.message.id},
  });
  return result;
}
