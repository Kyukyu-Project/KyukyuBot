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

const optMessageLabel = 'message';
const optChannelLabel = 'channel';

/**
 * @param {CommandContext|IContext} context
 * @return {SlashCommandBuilder}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const cHint =        l10n.s(lang, `commands.${canonName}.c-hint`);
  const optMessageHint = l10n.s(lang, `commands.${canonName}.opt-message-hint`);
  const optChannelHint = l10n.s(lang, `commands.${canonName}.opt-channel-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addStringOption((option) => option
          .setName(optMessageLabel)
          .setDescription(optMessageHint)
          .setRequired(true),
      )
      .addChannelOption((option) => option
          .setName(optChannelLabel)
          .setDescription(optChannelHint),
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
    const what = interaction.options.get(optMessageLabel).value;
    const where = interaction.options.getChannel(optChannelLabel);
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
