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
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

const responseLabel = 'response';
const messageIdLabel = 'message-id';

/**
 * @param {CommandContext|IContext} context
 * @return {SlashCommandBuilder}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const desc          = l10n.s(lang, `commands.${canonName}.desc`);
  const responseDesc  = l10n.s(lang, `commands.${canonName}.response-hint`);
  const messageIdDesc = l10n.s(lang, `commands.${canonName}.message-id-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(desc)
      .addStringOption((option) => option
          .setName(responseLabel)
          .setDescription(responseDesc)
          .setRequired(true),
      )
      .addStringOption((option) => option
          .setName(messageIdLabel)
          .setDescription(messageIdDesc)
          .setRequired(true),
      );
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, channel, lang, interaction} = context;
  const {l10n} = client;

  if (context.userIsMod) {
    interaction.deferReply({ephemeral: true});
    const replyWith = interaction.options.get(responseLabel).value;
    const replyTo = interaction.options.get(messageIdLabel).value;
    const responseSent = l10n.s(lang, `commands.${canonName}.response-sent`);
    const responseError = l10n.s(lang, `commands.${canonName}.response-error`);

    channel
        .send({
          content: replyWith,
          reply: {messageReference: replyTo, failIfNotExists: true},
        })
        .then(() => interaction.editReply(responseSent))
        .catch(() => interaction.editReply(responseError));
    return true;
  } else {
    const noPermission = l10n.s(lang, 'messages.no-permission');
    interaction.reply({content: noPermission, ephemeral: true});
    return false;
  }
}
