/**
 * @typedef {import('../../src/typedef.js').DeploymentContext} DeploymentContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {ContextMenuCommandBuilder} from '@discordjs/builders';

import {Modal, MessageActionRow, TextInputComponent} from 'discord.js';

import {l10n} from '../../src/l10n.js';

export const canonName = 'admin.reply';
export const name = 'reply';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.MODERATOR;
export const cooldown = 0;

let eventHandlerAttached = false;

/**
 * @param {DeploymentContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  return new ContextMenuCommandBuilder().setName(name).setType(3);
}

const modalEventHandler = async (i) => {
  if (!i.isModalSubmit()) return;
  i.deferUpdate();
  const {customId, fields, channel} = i;
  if (customId.startsWith('reply.')) {
    const respondTo = customId.slice('reply.'.length);
    const responseMessage = fields.getTextInputValue('responseInput');
    channel.send({
      content: responseMessage,
      reply: {messageReference: respondTo},
    });
  }
};

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;

  const modalTitle = l10n.s(lang, `commands.${canonName}.modal-title`);
  const responseLabel = l10n.s(lang, `commands.${canonName}.response-label`);

  if (context.userIsMod || context.hasAdminPermission) {
    if (!eventHandlerAttached) {
      client.on('interactionCreate', modalEventHandler);
      eventHandlerAttached = true;
    }

    const modal = new Modal()
        .setCustomId(`reply.${interaction.targetId}`)
        .setTitle(modalTitle)
        .addComponents(
            new MessageActionRow().addComponents(
                new TextInputComponent()
                    .setCustomId('responseInput')
                    .setLabel(responseLabel)
                    .setStyle('PARAGRAPH')
                    .setRequired(false),
            ),
        );

    await interaction.showModal(modal);
    return true;
  } else {
    const noPermission = l10n.s(lang, 'messages.no-permission');
    interaction.reply({content: noPermission, ephemeral: true});
    return false;
  }
}
