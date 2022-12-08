/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').InteractionReplyOptions} InteractionReplyOptions
 */

import {ComponentType} from 'discord.js';
import {commands} from '../../src/commands.js';
import {l10n} from '../../src/l10n.js';
import {logger} from '../../src/logger.js';

const commandName = 'bot-admin';
const cooldown  = 0;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {locale, interaction, user} = context;
  const controlPanels = commands.controlPanels;
  const MenuOptions = controlPanels.map((cp) => {
    return cp.getNavMenuItem(context);
  });

  /** @type {InteractionReplyOptions} */
  const topContent = {
    embeds: [{
      title: l10n.s(locale, 'cmd.bot-admin.page.title'),
      description: l10n.s(locale, 'cmd.bot-admin.page.content'),
    }],
    components: [{
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          custom_id: 'top.select',
          placeholder: l10n.s(locale, 'cmd.bot-admin.nav-menu.placeholder'),
          options: MenuOptions,
        },
      ],
    }],
    fetchReply: true,
  };

  const responseMessage = await interaction.reply(topContent);

  context.responseContent = topContent;
  context.responseMessage = responseMessage;

  const iCollector = responseMessage.createMessageComponentCollector({
    idle: 2 * 60 * 1000, // Disable after 2 minute idle time
  });

  iCollector.on('end', (c) => {
    context.responseContent.components.forEach((row) => {
      row.components.forEach((el)=> el.disabled = true);
    });
    responseMessage.edit(context.responseContent);
  });

  iCollector.on('collect', async (i) => {
    if ((i.user.id !== user.id)) {
      // Can only be used by the user who invoked the command
      i.reply({
        content: l10n.s(locale, 'messages.command-error.no-user-permission'),
        ephemeral: true,
      });
      return;
    };
    // i.deferUpdate();

    const customId = i.customId;
    const value = i.values?.[0] || undefined;

    if (customId === 'top') {
      context.responseContent = topContent;
      i.update(topContent);
    } else if (customId === 'top.select') {
      const cp = controlPanels.find((cp) => cp.name === value);
      const content = cp.getContent(context);
      context.responseContent = content;
      i.update(content);
    } else {
      const cp = controlPanels.find((cp) => {
        try {
          return cp.handleInteraction(context, i);
        } catch (e) {
          return false;
        }
      });
      if (!cp) {
        logger.writeLog('client.error', {
          summary: 'Unhandled interaction',
          details: `custom_id: ${customId}, value: ${value}`,
        });
      } else {
        i.update(context.responseContent);
      }
    }
  });

  return false;
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
