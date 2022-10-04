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
  const {interaction} = context;
  const {options} = interaction;
  const query = options.getString('query');
  if (query) {
    const [contentLocale, contentId] = query.split(':');

    const helpResult = l10n.s(contentLocale, 'cmd-help')
        .find((content) => content.id === contentId);

    if (helpResult) {
      interaction.reply({
        content: helpResult.content,
        ephemeral: ephemeral,
      });
      return true;
    }
  }

  interaction.reply({
    content: 'not found',
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
  const focused = options.getFocused();
  const searchResult = l10n.findByKeywords(locale, 'cmd-help', focused);
  interaction.respond(searchResult);
}
