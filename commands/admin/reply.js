/**
 * @typedef {import('../../src/l10n.js').L10N} L10N
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'admin.reply';
export const name = 'reply';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.MODERATOR;
export const cooldown = 0;

const responseLabel = 'response';
const messageIdLabel = 'message-id';
const channelLabel = 'channel';

/**
 * @param {CommandContext|IContext} context
 * @return {SlashCommandBuilder}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const hint          = l10n.s(lang, `commands.${canonName}.command-hint`);
  const responseHint  = l10n.s(lang, `commands.${canonName}.response-hint`);
  const messageIdHint = l10n.s(lang, `commands.${canonName}.message-id-hint`);
  const channelHint = l10n.s(lang, `commands.${canonName}.channel-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(hint)
      .addStringOption((option) => option
          .setName(responseLabel)
          .setDescription(responseHint)
          .setRequired(true),
      )
      .addStringOption((option) => option
          .setName(messageIdLabel)
          .setDescription(messageIdHint)
          .setRequired(true),
      )
      .addChannelOption((option) => option
          .setName(channelLabel)
          .setDescription(channelHint)
          .setRequired(false),
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
    const replyWith = interaction.options.get(responseLabel).value;
    const replyTo = interaction.options.get(messageIdLabel).value;
    const replyWhere = interaction.options.getChannel(channelLabel);
    const responseError = l10n.s(lang, `commands.${canonName}.response-error`);

    try {
      if ((replyWhere) && (replyWhere.id !== channel.id)) {
        const sentMessage = await replyWhere.send({
          content: replyWith,
          reply: {messageReference: replyTo, failIfNotExists: true},
        });

        interaction.editReply(
            l10n.t(
                lang,
                `commands.${canonName}.response-sent-elsewhere`,
                '{MESSAGE URL}',
                sentMessage.url,
            ),
        );
      } else {
        await channel.send({
          content: replyWith,
          reply: {messageReference: replyTo, failIfNotExists: true},
        });

        interaction.editReply(
            l10n.s(lang, `commands.${canonName}.response-sent-here`),
        );
      }
    } catch (error) {
      interaction.editReply(responseError);
    }
    return true;
  } else {
    const noPermission = l10n.s(lang, 'messages.no-permission');
    interaction.reply({content: noPermission, ephemeral: true});
    return false;
  }
}
