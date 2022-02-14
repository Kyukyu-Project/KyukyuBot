/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
* @typedef {import('../../src/typedef.js').InteractionContext} InteractionContext
*/
import {COMMAND_TYPE} from '../../src/typedef.js';

export const canonName = 'general.say';
export const name = 'say';
// export const requireArgs = false;
export const commandType = COMMAND_TYPE.GENERAL;
export const cooldown = 0;

const MESSAGE_SENT        = `commands.${canonName}.message-sent`;
const SENDING_MESSAGE     = `commands.${canonName}.sending-message`;
const NO_PERMISSION       = `commands.${canonName}.no-permission`;

/**
 * @param {InteractionContext} context
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
