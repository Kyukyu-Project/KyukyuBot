/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {l10n} from '../../src/l10n.js';

const commandName = 'bot-avatar';
const cooldown  = 0;

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean}
 **/
async function set(context) {
  const {client, locale, interaction} = context;
  const {options} = interaction;

  await interaction.deferReply();

  const attachments = options.getAttachment('attach');
  const contentType = attachments.contentType.toLowerCase();

  if (['image/jpeg', 'image/gif', 'image/png'].indexOf(contentType) !== -1) {
    try {
      await client.user.setAvatar(attachments.url);
      interaction.editReply({
        content: l10n.s(locale, 'cmd.bot-avatar.set-result'),
      });
      return true;
    } catch (error) {
      interaction.editReply({
        content: l10n.s(locale, 'cmd.bot-avatar.set-error'),
      });
      throw error;
    }
  } else {
    interaction.editReply({
      content: l10n.s(locale, 'cmd.bot-avatar.set-error'),
    });
    throw new Error('Attachment is not an image');
  }
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean}
 **/
async function get(context) {
  const {client, locale, interaction} = context;

  const avatarUrl = client.user.avatarURL();
  interaction.reply({
    content: l10n.s(locale, 'cmd.bot-avatar.get-result'),
    embeds: [{image: {url: avatarUrl}}],
  });

  return true;
}

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {interaction} = context;
  const {options} = interaction;

  switch (options.getSubcommand()) {
    case 'get': return get(context);
    case 'set': return set(context);
    default: return false;
  }
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
