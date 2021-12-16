
/**
* @typedef {import('../../typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../typedef.js';

export const name = 'admin.unset-bot-channel';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.ADMIN;

const keyPrefix = `commands.${name}`;

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {client, lang, guild, guildSettings} = context;
  const l10n = client.l10n;

  if (!guild) return; // Not guild text channel

  const prevBotChannel = guildSettings['bot-channel'] || '';
  let response;
  if (prevBotChannel) {
    response = l10n.t(
        lang, `${keyPrefix}.success`,
        '{CHANNEL}', `<#${prevBotChannel}>`);
    l10n.s(lang, `${keyPrefix}.no-bot-channel`);
    guildSettings['bot-channel'] = '';
    client.updateGuildSettings(context.guild, guildSettings);
  } else {
    response = l10n.s(lang, `${keyPrefix}.no-bot-channel`);
  }

  return context.channel.send({
    content: response,
    reply: {messageReference: context.message.id},
  });
}
