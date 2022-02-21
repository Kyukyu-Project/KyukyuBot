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
export const commandType = COMMAND_TYPE.ADMIN;
export const cooldown = 0;

/**
 * @param {CommandContext|IContext} context
 * @return {SlashCommandBuilder}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const desc =        l10n.s(lang, `commands.${canonName}.desc`);
  const messageDesc = l10n.s(lang, `commands.${canonName}.message-desc`);
  const channelDesc = l10n.s(lang, `commands.${canonName}.channel-desc`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(desc)
      .addStringOption((option) => option
          .setName('message')
          .setDescription(messageDesc)
          .setRequired(true),
      )
      .addChannelOption((option) => option
          .setName('channel')
          .setDescription(channelDesc),
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
