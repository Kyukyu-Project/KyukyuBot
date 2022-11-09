/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {l10n} from '../../src/l10n.js';
import {smartReply} from '../../src/smart-reply.js';

export const commandName = 'aow-info';
export const cooldown  = 5;

/**
 * Resource key of content database
 */
const DbResKey = 'aow-info';

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {locale, interaction} = context;
  const {options} = interaction;

  /**
   * @type {string}
   * User query
   */
  const query = options.getString('query');

  /**
   * Tagged user
   */
  const taggedUser = options.getUser('tag');
  const taggedUserId = taggedUser?taggedUser.id:undefined;

  if (query) {
    const queryResult = l10n.autocomplete.getContent(locale, query, DbResKey);

    if (queryResult) {
      smartReply({
        locale: locale,
        interaction: interaction,
        content: queryResult,
        dbResKey: DbResKey,
        userId: interaction.user.id,
        taggedUserId: taggedUserId,
      });
      return true;
    }
  }

  interaction.reply(l10n.s(locale, 'messages.command-error.not-found'));
  return false;
}

/**
 * @param {CommandContext} context - Interaction context
 */
export function autocomplete(context) {
  const {interaction} = context;
  const locale = interaction.locale;
  const query = interaction.options.getFocused();

  let options =
    l10n.autocomplete.suggestContent(locale, query, DbResKey, 'keywords');

  if (!options.length) {
    const defaultList = l10n.s(locale, `${DbResKey}.default-list`);
    options = l10n
        .autocomplete
        .getDefaultSuggestions(locale, DbResKey, defaultList);
  }

  if (options) {
    options = options.map((c) => ({name: c.title, value: c.id}));
  } else {
    options = [];
  }

  interaction.respond(options);
}
