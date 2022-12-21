/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {get} from 'https';
import {AttachmentBuilder} from 'discord.js';
import {l10n} from '../../src/l10n.js';

const commandName = 'post-message';
const cooldown  = 10;

const COLORS = {
  // Light
  lightRed: 13928837, // d48985
  lightGold: 16040254, // f4c13e
  lightGreen: 10472529, // 9fcc51
  lightBlue: 8563146, // 82a9ca
  lightPurple: 11697841, // b27eb1
  // Dark
  red: 13928837, // b93a35
  gold: 16040254, // b6912e
  green: 10472529, // 77993d
  blue: 8563146, // 3271a6
  purple: 11697841, // 856085
};

/**
 * @param {string} url - Interaction context
 * @return {Promise<Buffer>}
 **/
function urlToBuffer(url) {
  return new Promise((resolve, reject) => {
    /** @type {Uint8Array[]} */
    const data = [];

    get(url, (res) => res
        .on('data', (chunk) => data.push(chunk))
        .on('end', () => resolve(Buffer.concat(data)))
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

  const format = options.getString('format')||'regular';
  const textMessage = options.getString('message');
  const replaceMessageId = options.getString('replace-message');
  const destination = options.getChannel('channel')||channel;

  const reply = {content: ''};

  if (format === 'regular') {
    reply.content = textMessage;
  } else {
    let color;
    switch (format) {
      case 'embed-red': color = COLORS.lightRed; break;
      case 'embed-gold': color = COLORS.lightGold; break;
      case 'embed-green': color = COLORS.lightGreen; break;
      case 'embed-blue': color = COLORS.lightBlue; break;
      case 'embed-purple': color = COLORS.lightPurple; break;
    }
    reply.embeds = [{color: color, description: textMessage}];
  }

  const attachment = options.getAttachment('attach');
  if (attachment) {
    const buffer = await urlToBuffer(attachment.url);
    reply.files = [new AttachmentBuilder(buffer, {name: attachment.name})];
  }

  if (replaceMessageId) {
    // const replacedMessage = channel.messages.cache.get(replaceMessageId);
    try {
      const replacedMessage =
          await destination.messages.fetch(replaceMessageId);

      if (
        !replacedMessage ||
        (replacedMessage.author.id !== client.user.id)
      ) {
        throw new Error();
      }

      return new Promise((resolve, reject) => {
        replacedMessage
            .edit(reply)
            .then(() => {
              interaction.editReply(
                  l10n.s(locale, 'cmd.post-message.message-sent'),
              );
              resolve(true);
            })
            .catch((error) => {
              interaction.editReply(
                  l10n.s(locale, 'cmd.post-message.message-error'),
              );
              reject(error);
            });
      });
    } catch (e) {
      interaction.editReply(
          l10n.s(locale, 'cmd.post-embeds.message-replace-error'),
      );
      return false;
    }
  }

  return new Promise((resolve, reject) => {
    destination
        .send(reply)
        .then(() => {
          interaction.editReply(
              l10n.s(locale, 'cmd.post-message.message-sent'),
          );
          resolve(true);
        })
        .catch((error) => {
          interaction.editReply(
              l10n.s(locale, 'cmd.post-message.message-error'),
          );
          reject(error);
        });
  });
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
