/**
 * @typedef {import('../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../src/typedef.js').CommandActionResult} ActionResult
 */

import {l10n} from '../src/l10n.js';

export const commandName = 'help';
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
    const helpResult = l10n.autocomplete.getContent(locale, query, 'cmd-help');

    if (helpResult && helpResult.text) {
      interaction.reply({
        content: helpResult.text,
        ephemeral: ephemeral,
      });
      return true;
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

  let suggestions =
    l10n.autocomplete.suggestContent(locale, query, 'cmd-help', 'keywords');

  if (!suggestions.length) {
    const defaultList = l10n.s(locale, 'cmd-help.default-list');
    suggestions = l10n
        .autocomplete
        .getDefaultSuggestions(locale, 'cmd-help', defaultList);
  }

  if (suggestions) {
    interaction.respond(
        suggestions.map((content) => ({
          name: content.title,
          value: content.id,
        })),
    );
  } else interaction.respond([]);
}
