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

const messageLabel = 'message';
const channelLabel = 'channel';

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
          .setName(messageLabel)
          .setDescription(messageHint)
          .setRequired(true),
      )
      .addChannelOption((option) => option
          .setName(channelLabel)
          .setDescription(channelHint),
      );
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, channel, lang, interaction} = context;
  const {l10n} = client;

  if (context.userIsMod || context.hasAdminPermission) {
    await interaction.deferReply({ephemeral: true});
    const what = interaction.options.get('message').value;
    const where = interaction.options.getChannel(channelLabel);
    const responseError = l10n.s(lang, `commands.${canonName}.response-error`);

    try {
      if ((where) && (where.id !== channel.id)) {
        const replyMessage = await where.send(what);
        interaction.editReply({
          content: l10n.t(
              lang,
              `commands.${canonName}.message-sent-elsewhere`,
              '{MESSAGE URL}',
              replyMessage.url,
          ),
          ephemeral: true,
        });
      } else {
        await channel.send(what);
        interaction.editReply(
            l10n.s(lang, `commands.${canonName}.message-sent-here`),
        );
      }
      return true;
    } catch (error) {
      interaction.editReply(responseError);
      return false;
    }
  } else {
    const noPermission = l10n.s(lang, 'messages.no-permission');
    interaction.reply({content: noPermission, ephemeral: true});
    return false;
  }
}
