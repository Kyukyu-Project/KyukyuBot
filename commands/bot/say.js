/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {get} from 'https';
import {AttachmentBuilder} from 'discord.js';
import {l10n} from '../../src/l10n.js';

const commandName = 'say';
const cooldown  = 10;

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
  const {locale, channel, interaction} = context;
  const {options} = interaction;

  await interaction.deferReply({ephemeral: true});

  const reply = {content: options.getString('message')};

  const destination = options.getChannel('channel')||channel;

  const attachment = options.getAttachment('attach');
  if (attachment) {
    const buffer = await urlToBuffer(attachment.url);
    reply.files = [new AttachmentBuilder(buffer, {name: attachment.name})];
  }

  return new Promise((resolve, reject) => {
    destination
        .send(reply)
        .then(() => {
          interaction.editReply(l10n.s(locale, 'cmd.say.message-sent'));
          resolve(true);
        })
        .catch((error) => {
          interaction.editReply(l10n.s(locale, 'cmd.say.message-error'));
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
