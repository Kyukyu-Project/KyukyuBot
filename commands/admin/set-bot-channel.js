/**
* @typedef {import('../../typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../typedef.js';

export const name = 'admin.set-bot-channel';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.ADMIN;

import {getChannelId} from '../../utils/utils.js';

const keyPrefix = `commands.${name}`;

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {client, lang, guild, guildSettings} = context;
  const l10n = client.l10n;

  if (!guild) return; // Not guild text channel

  let response;
  const prevBotChannel = guildSettings['bot-channel'] || '';
  const newBotChannel = getChannelId(context.args[0]);

  if (!newBotChannel) { // show bot channel
    if (prevBotChannel) {
      response = l10n.t(
          lang, `${keyPrefix}.show-value`,
          '{CHANNEL}', `<#${prevBotChannel}>`);
    } else {
      response = l10n.s(lang, `${keyPrefix}.no-bot-channel`);
    }
  } else if (prevBotChannel == newBotChannel) { // already the bot channel
    response = l10n.t(
        lang, `${keyPrefix}.already-the-bot-channel`,
        '{CHANNEL}', `<#${newBotChannel}>`);
  } else if (guild.channels.cache.get(newBotChannel)?.isText()) { // set
    guildSettings['bot-channel'] = newBotChannel;
    response = l10n.t(
        lang, `${keyPrefix}.success`,
        '{CHANNEL}', `<#${newBotChannel}>`);
    client.updateGuildSettings(context.guild, guildSettings);
  } else { // invalid
    response = l10n.t(
        lang, `${keyPrefix}.not-a-text-channel`,
        '{CHANNEL}', `<#${newBotChannel}>`);
  }
  return context.channel.send({
    content: response,
    reply: {messageReference: context.message.id},
  });
}
