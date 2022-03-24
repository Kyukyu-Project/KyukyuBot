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

const optResponseLabel = 'response';
const optMessageIdLabel = 'message-id';
const optChannelLabel = 'channel';

/**
 * @param {CommandContext|IContext} context
 * @return {SlashCommandBuilder}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const cHint =
      l10n.s(lang, `commands.${canonName}.c-hint`);
  const optResponseHint  =
      l10n.s(lang, `commands.${canonName}.opt-response-hint`);
  const optMessageIdHint =
      l10n.s(lang, `commands.${canonName}.opt-message-id-hint`);
  const optChannelHint =
      l10n.s(lang, `commands.${canonName}.opt-channel-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addStringOption((option) => option
          .setName(optResponseLabel)
          .setDescription(optResponseHint)
          .setRequired(true),
      )
      .addStringOption((option) => option
          .setName(optMessageIdLabel)
          .setDescription(optMessageIdHint)
          .setRequired(true),
      )
      .addChannelOption((option) => option
          .setName(optChannelLabel)
          .setDescription(optChannelHint)
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
    const replyWith = interaction.options.get(optResponseLabel).value;
    const replyTo = interaction.options.get(optMessageIdLabel).value;
    const replyWhere = interaction.options.getChannel(optChannelLabel);
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
