/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import {postNavigable} from '../../utils/navigable.js';

export const canonName = 'aow.troops';
export const name = 'troops';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const optTroopsLabel  = 'troops';
const optTagLabel     = 'tag-user';
const optMessageLabel = 'tag-message';

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const optTroopsHint = l10n.s(lang, `commands.${canonName}.opt-troops-hint`);
  const optTagHint = l10n.s(lang, `commands.${canonName}.opt-tag-hint`);
  const optMessageHint = l10n.s(lang, `commands.${canonName}.opt-message-hint`);

  const troopsInfo = l10n.s(lang, 'aow.troops');

  const troopsList = troopsInfo
      .map((troops) => (troops.name))
      .sort((a, b) => (a.localeCompare(b, lang)))
      .map((troops) => ([troops, troops]));

  const data = new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addStringOption((option) => option
          .setName(optTroopsLabel)
          .setDescription(optTroopsHint)
          .setRequired(true)
          .addChoices(troopsList),
      )
      .addUserOption((option) => option
          .setName(optTagLabel)
          .setDescription(optTagHint)
          .setRequired(false),
      )
      .addStringOption((option) => option
          .setName(optMessageLabel)
          .setDescription(optMessageHint)
          .setRequired(false),
      );

  return data;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;
  const {l10n} = client;

  const troops = interaction.options.getString(optTroopsLabel);
  const info = l10n.s(lang, 'aow.troops')?.find((el) => el.name === troops);

  if (info) {
    const userId = interaction.user.id;
    const taggedId = interaction.options.getUser(optTagLabel)?.id || null;
    const users = taggedId?[userId, taggedId]:[userId];

    const message = interaction.options.getString(optMessageLabel) || null;

    let content = l10n.t(
        lang, 'messages.use-command',
        '{PREFIX}', '/',
        '{COMMAND}', name,
        '{USER ID}', userId);

    if (taggedId) {
      if (message) {
        content += '\n' + l10n.t(
            lang, 'messages.tag-user-with-message',
            '{USER ID}', userId,
            '{TAGGED ID}', taggedId,
            '{MESSAGE}', message);
      } else {
        content += '\n' + l10n.t(
            lang, 'messages.tag-user',
            '{USER ID}', userId,
            '{TAGGED ID}', taggedId);
      }
    }

    if (info.embeds) { // tabbed
      postNavigable(context, content, info.embeds, users);

      interaction.reply({
        content: l10n.s(lang, 'messages.info-sent'),
        ephemeral: true,
      });
    } else { // non-tabbed
      // cannot send Embed using interaction.reply due to Discord API bug #2612
      interaction.channel.send({
        content: content,
        embeds: [info.embed],
      }).then((response) => {
        interaction.reply({
          content: l10n.s(lang, 'messages.info-sent'),
          ephemeral: true,
        });
      });
    }
    return true;
  } else {
    interaction.reply({content: l10n.s(lang, NO_INFO), ephemeral: true});
    return false;
  }
}
