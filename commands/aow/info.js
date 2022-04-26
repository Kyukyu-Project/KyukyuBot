/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'aow.info';
export const name = 'info';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const optSubjectLabel  = 'subject';

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const optSubjectHint = l10n.s(lang, `commands.${canonName}.opt-subject-hint`);

  const info = l10n.s(lang, 'aow.info') || [];
  const choices = info
      .map((item) => item.name)
      .sort((a, b) => a[0].localeCompare(b[0], lang))
      .map((item) => [item, item]);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addStringOption((option) => option
          .setName(optSubjectLabel)
          .setDescription(optSubjectHint)
          .setRequired(true)
          .addChoices(choices),
      );
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;
  const {l10n} = client;

  const subject = interaction.options.getString('subject');
  const info = l10n.s(lang, 'aow.info')?.find((el) => el.name === subject);

  if (info) {
    // cannot send Embed using interaction.reply due to Discord API bug #2612
    interaction.channel.send({
      content: l10n.t(
          lang, 'messages.slash-command',
          '{COMMAND}', name,
          '{USER ID}', interaction.user.id),
      embeds: [info.embed],
    });
    interaction.reply({
      content: l10n.s(lang, `commands.${canonName}.response-sent`),
      ephemeral: true});
    return true;
  } else {
    interaction.reply({content: l10n.s(lang, NO_INFO), ephemeral: true});
    return false;
  }
}
