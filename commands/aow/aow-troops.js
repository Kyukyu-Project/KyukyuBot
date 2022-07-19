/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';
import {reply} from '../../utils/reply.js';

export const canonName = 'aow.troops';
export const name = 'troops';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const optTroopsLabel  = 'troops';
const optTagLabel     = 'tag-user';

/**
 * @param {CommandContext|IContext} context
 * @return {SlashCommandBuilder}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const optTroopsHint = l10n.s(lang, `commands.${canonName}.opt-troops-hint`);
  const optTagHint = l10n.s(lang, `commands.${canonName}.opt-tag-hint`);

  const troopsInfo = l10n.s(lang, 'aow.troops');

  const troopsList = troopsInfo
      .map((troops) => (troops.name))
      .sort((a, b) => (a.localeCompare(b, lang)))
      .map((troops) => ({name: troops, value: troops}));

  const data = new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addStringOption((option) => option
          .setName(optTroopsLabel)
          .setDescription(optTroopsHint)
          .setRequired(true)
          .addChoices(...troopsList),
      )
      .addUserOption((option) => option
          .setName(optTagLabel)
          .setDescription(optTagHint)
          .setRequired(false),
      );

  return data;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {lang, interaction} = context;

  const troops = interaction.options.getString(optTroopsLabel);
  const info = l10n.s(lang, 'aow.troops')?.find((el) => el.name === troops);

  if (info) {
    const taggedId = interaction.options.getUser(optTagLabel)?.id || null;

    if (info.embeds) { // tabbed
      reply({
        'interaction': interaction,
        'lang': lang,
        'embeds': info.embeds,
        'tagged-user-id': taggedId,
      });
    } else { // non-tabbed
      reply({
        'interaction': interaction,
        'lang': lang,
        'embed': info.embed,
        'tagged-user-id': taggedId,
      });
    }
    return true;
  } else {
    interaction.reply({content: l10n.s(lang, NO_INFO), ephemeral: true});
    return false;
  }
}
