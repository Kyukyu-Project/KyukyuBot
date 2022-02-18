/**
 * @typedef {import('../../src/l10n.js').L10N} L10N
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_TYPE} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'general.say';
export const name = 'say';
export const requireArgs = true;
export const commandType = COMMAND_TYPE.GENERAL;
export const cooldown = 0;

const MESSAGE_SENT        = `commands.${canonName}.message-sent`;
const SENDING_MESSAGE     = `commands.${canonName}.sending-message`;
const NO_PERMISSION       = `commands.${canonName}.no-permission`;

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const DESC          = `commands.${canonName}.desc`;
  const MESSAGE_DESC  = `commands.${canonName}.message-desc`;
  const CHANNEL_DESC  = `commands.${canonName}.channel-desc`;

  return new SlashCommandBuilder()
      .setName('say')
      .setDescription(l10n.s(lang, DESC))
      .addStringOption((option) => option
          .setName('message')
          .setDescription(l10n.s(lang, MESSAGE_DESC))
          .setRequired(true),
      )
      .addChannelOption((option) => option
          .setName('channel')
          .setDescription(l10n.s(lang, CHANNEL_DESC)),
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
    interaction.reply({
      content: l10n.s(lang, SENDING_MESSAGE),
      ephemeral: true});

    const what = interaction.options.get('message').value;
    const where =
      interaction.options.getChannel('channel') || interaction.channel;

    where.send(what).then((msg) => {
      interaction.editReply({
        content: l10n.t(lang, MESSAGE_SENT, '{MESSAGE URL}', msg.url),
        ephemeral: true});
    });
  } else {
    const response = l10n.s(lang, NO_PERMISSION);
    interaction.reply({content: response, ephemeral: true});
  }
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  // const {client, lang, channel} = context;
  return false;
}
