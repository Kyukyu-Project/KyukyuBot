/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';

export const canonName = 'general.invite';
export const name = 'invite';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 0;

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint);
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;

  const inviteLink =
      'https://discord.com/api/oauth2/authorize?client_id=' +
      client.application.id +
      '&permissions=277294204992&scope=bot%20applications.commands';

  const response = l10n.t(
      lang,
      `commands.${canonName}.response`,
      '{INVITE LINK}', inviteLink);

  interaction.reply({content: response, ephemeral: true});
  return true;
}
