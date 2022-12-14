/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {get} from 'https';
import {EmbedBuilder} from 'discord.js';
import {l10n} from '../../src/l10n.js';

const commandName = 'post-embeds';
const cooldown  = 10;

/**
 * @param {string} url - Source url
 * @return {Promise<JSON>}
 **/
function urlToJson(url) {
  return new Promise((resolve, reject) => {
    let data = '';

    get(url, (res) => res
        .on('data', (chunk) => data += chunk)
        .on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => reject(err)),
    );
  });
}

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {Promise}
 */
async function execute(context) {
  const {client, locale, channel, interaction} = context;
  const {options} = interaction;

  await interaction.deferReply({ephemeral: true});

  const message = options.getString('message');
  const embed1 = options.getAttachment('embed1');
  const embed2 = options.getAttachment('embed2');
  const embed3 = options.getAttachment('embed3');
  const replaceMessageId = options.getString('replace');

  const embeds = [];

  try {
    let content = (await urlToJson(embed1.url));
    console.log(content);

    embeds.push(new EmbedBuilder(content));

    if (embed2) {
      content = (await urlToJson(embed2.url));
      embeds.push(new EmbedBuilder(content));
    }

    if (embed3) {
      content = (await urlToJson(embed3.url));
      embeds.push(new EmbedBuilder(content));
    }
  } catch (error) {
    interaction.editReply(l10n.s(locale, 'cmd.post-embeds.message-error'));
    throw (error);
  }

  const reply = {embeds: embeds};
  if (message) reply.content = message;

  if (replaceMessageId) {
    const replacedMessage = channel.messages.cache.get(replaceMessageId);

    if (
      !replacedMessage ||
      (replacedMessage.author.id !== client.user.id)
    ) {
      interaction.editReply(l10n.s(locale, 'cmd.post-embeds.message-error'));
      return false;
    }

    return new Promise((resolve, reject) => {
      replacedMessage
          .edit(reply)
          .then(() => {
            interaction.editReply(
                l10n.s(locale, 'cmd.post-embeds.message-sent'),
            );
            resolve(true);
          })
          .catch((error) => {
            interaction.editReply(
                l10n.s(locale, 'cmd.post-embeds.message-error'),
            );
            reject(error);
          });
    });
  } else {
    return new Promise((resolve, reject) => {
      channel
          .send(reply)
          .then(() => {
            interaction.editReply(
                l10n.s(locale, 'cmd.post-embeds.message-sent'),
            );
            resolve(true);
          })
          .catch((error) => {
            interaction.editReply(
                l10n.s(locale, 'cmd.post-embeds.message-error'),
            );
            reject(error);
          });
    });
  }
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
