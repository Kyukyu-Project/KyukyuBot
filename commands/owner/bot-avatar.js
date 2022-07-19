/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';

export const canonName = 'owner.bot-avatar';
export const name = 'bot-avatar';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.OWNER;
export const cooldown = 0;

const IMG_CONTENT_TYPES = ['image/jpeg', 'image/gif', 'image/png'];

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {lang} = context;
  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addAttachmentOption((option) => option
          .setName('image')
          .setDescription('new avatar image'));
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {lang, interaction} = context;

  const updateSuccess = l10n.s(lang, `commands.${canonName}.success`);
  const updateError = l10n.s(lang, `commands.${canonName}.error`);
  const attachments = interaction.options.getAttachment('attachment');

  if (IMG_CONTENT_TYPES.indexOf(attachments.contentType.toLowerCase()) !== -1) {
    try {
      await context.client.user.setAvatar(attachments.url);
      interaction.reply({content: updateSuccess, ephemeral: true});
      return true;
    } catch (error) {
      interaction.reply({content: updateError, ephemeral: true});
      throw error;
    }
  } else {
    interaction.reply({content: updateError, ephemeral: true});
    throw new Error('Attachment is not an image');
  }
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {lang, channel, message} = context;
  const updateSuccess = l10n.s(lang, `commands.${canonName}.success`);
  const updateError = l10n.s(lang, `commands.${canonName}.error`);
  const attachments = context.message.attachments;
  if (attachments.size) {
    const file = context.message.attachments.first();
    if (IMG_CONTENT_TYPES.indexOf(file.contentType.toLowerCase()) !== -1) {
      try {
        await context.client.user.setAvatar(file.url);
        channel.send({
          content: updateSuccess, reply: {messageReference: message.id},
        });
        return true;
      } catch (error) {
        channel.send({
          content: updateError, reply: {messageReference: message.id},
        });
        throw error;
      }
    } else {
      channel.send({
        content: updateError, reply: {messageReference: message.id},
      });
      throw new Error('Attachment is not an image');
    }
  }
  return false;
}
