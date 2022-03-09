/**
 * @typedef {import('../../src/l10n.js').L10N} L10N
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'admin.say';
export const name = 'say';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.MODERATOR;
export const cooldown = 0;

/**
 * @param {CommandContext|IContext} context
 * @return {SlashCommandBuilder}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const hint =        l10n.s(lang, `commands.${canonName}.command-hint`);
  const messageHint = l10n.s(lang, `commands.${canonName}.message-hint`);
  const channelHint = l10n.s(lang, `commands.${canonName}.channel-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(hint)
      .addStringOption((option) => option
          .setName('message')
          .setDescription(messageHint)
          .setRequired(true),
      )
      .addChannelOption((option) => option
          .setName('channel')
          .setDescription(channelHint),
      );
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;
  const {l10n} = client;

  if (context.userIsMod) {
    const what = interaction.options.get('message').value;
    const where =
      interaction.options.getChannel('channel') || interaction.channel;

    where.send(what).then((msg) => {
      const messageSent = l10n.t(
          lang,
          `commands.${canonName}.message-sent`,
          '{MESSAGE URL}',
          msg.url,
      );
      interaction.reply({content: messageSent, ephemeral: true});
      return true;
    });
  } else {
    const noPermission = l10n.s(lang, 'messages.no-permission');
    interaction.reply({content: noPermission, ephemeral: true});
    return false;
  }
}
