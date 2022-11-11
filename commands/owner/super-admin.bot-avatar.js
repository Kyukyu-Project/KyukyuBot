/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {PermissionFlagsBits} from 'discord.js';
import {l10n} from '../../src/l10n.js';

const requiredAppPermissions = PermissionFlagsBits.SendMessages;

/** If interaction result should be ephemeral (private to user) */
const EPHEMERAL = false;

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean}
 **/
async function set(context) {
  const {client, locale, interaction} = context;
  const {options} = interaction;

  const attachments = options.getAttachment('attach');
  const contentType = attachments.contentType.toLowerCase();

  if (['image/jpeg', 'image/gif', 'image/png'].indexOf(contentType) !== -1) {
    try {
      await client.user.setAvatar(attachments.url);
      interaction.reply({
        content: l10n.s(locale, 'cmd.super-admin.bot-avatar.set-result'),
        ephemeral: EPHEMERAL,
      });
      return true;
    } catch (error) {
      interaction.reply({
        content: l10n.s(locale, 'cmd.super-admin.bot-avatar.set-error'),
        ephemeral: EPHEMERAL,
      });
      throw error;
    }
  } else {
    interaction.reply({
      content: l10n.s(locale, 'cmd.super-admin.bot-avatar.set-error'),
      ephemeral: EPHEMERAL,
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
    content: l10n.s(locale, 'cmd.super-admin.bot-avatar.get-result'),
    embeds: [{image: {url: avatarUrl}}],
    ephemeral: EPHEMERAL,
  });

  return true;
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction} = context;
  const {locale, appPermissions, options} = interaction;

  if (!appPermissions.has(requiredAppPermissions)) {
    interaction.reply(
        l10n.s(locale, 'messages.command-error.no-app-permission'),
    );
    return false;
  }

  switch (options.getSubcommand()) {
    case 'get': return get(context);
    case 'set': return set(context);
    default: return false;
  }
}
