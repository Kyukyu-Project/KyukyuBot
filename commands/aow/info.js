/**
 * @typedef {import('../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../src/typedef.js').CommandActionResult} ActionResult
 */

import {l10n} from '../../src/l10n.js';

export const commandName = 'info';
export const cooldown  = 5;
const ephemeral = false;

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {locale, interaction} = context;
  const {options} = interaction;
  /** @type {string} */ const query = options.getString('query');
  if (query) {
    const infoResult = l10n.autocomplete.getContent(locale, query, 'cmd-info');
    console.log(infoResult);

    if (infoResult) {
      if (infoResult.embeds) {
        interaction.reply({
          embeds: infoResult.embeds,
          ephemeral: ephemeral,
        });
        return true;
      } else if (Array.isArray(infoResult)) {
        interaction.reply({
          embeds: infoResult[0].embeds,
          ephemeral: ephemeral,
        });
        return true;
      }
    }
  }

  interaction.reply({
    content: l10n.s(locale, 'messages.command-error.not-found'),
    ephemeral: ephemeral,
  });
  return false;
}

/**
 * @param {CommandContext} context - Interaction context
 */
export function autocomplete(context) {
  const {interaction} = context;
  const {locale, options} = interaction;
  const query = options.getFocused();

  const suggestions =
    l10n.autocomplete.suggestContent(locale, query, 'cmd-info', 'keywords');

  /*
  if (!suggestions.length) {
    const defaultList = l10n.s(locale, 'cmd-info.default-list');
    suggestions = l10n
        .autocomplete
        .getDefaultSuggestions(locale, 'cmd-info', defaultList);
  }
  */

  if (suggestions) {
    interaction.respond(
        suggestions.map((content) => ({
          name: content.title,
          value: content.id,
        })),
    );
  } else interaction.respond([]);
}
