/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {data} from '../../src/data.js';
import {l10n} from '../../src/l10n.js';

export const commandName = 'manage-events';
export const cooldown  = 0;
const ephemeral = false;

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction} = context;
  let actionResult;
  switch (interaction.options.getSubcommand()) {
    case 'add-cm': actionResult = addCm(context); break;
    case 'add-wof': actionResult = addWof(context); break;
    case 'remove': actionResult = remove(context); break;
  }

  interaction.reply({
    content: actionResult.response,
    ephemeral: ephemeral,
  });

  return actionResult.success;
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 */
function addCm(context) {
  const {locale, interaction} = context;
  const {options} = interaction;

  const heroes = [
    'hero1', 'hero2', 'hero3', 'hero4', 'hero5', 'hero6',
  ].map((field) => (
    l10n
        .autocomplete
        .getContent(locale, options.getString(field), 'hero', 'part-of')
  ));

  if (heroes.includes(undefined)) {
    return {
      response: l10n.s(locale, 'cmd.manage-events.add-error'),
      success: false,
    };
  }

  const newEvent = data.addCmEvent(heroes.map((h) => h.id));

  if (newEvent.heroes.length) {
    const heroDisplayNames = heroes.map((el) => el['display-name']);

    return {
      response: l10n.t(
          locale, `cmd.manage-events.add-result`,
          '{DATE}', l10n.formatDate(locale, new Date(newEvent.ts)),
          '{HEROES}', l10n.makeList(locale, heroDisplayNames),
      ),
      success: true,
    };
  } else {
    return {
      response: l10n.s(locale, 'cmd.manage-events.add-error'),
      success: false,
    };
  }
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 */
function addWof(context) {
  const {locale, interaction} = context;
  const {options} = interaction;

  const heroes = ['hero1', 'hero2'].map((field) => (
    l10n
        .autocomplete
        .getContent(locale, options.getString(field), 'hero', 'part-of')
  ));

  if ((heroes[0] === undefined) || (heroes[1] === undefined)) {
    return {
      response: l10n.s(locale, 'cmd.manage-events.add-error'),
      success: false,
    };
  }

  const newEvent = data.addWofEvent([heroes[0].id, heroes[1].id]);

  if (newEvent.heroes.length) {
    const heroDisplayNames = [
      heroes[0]['display-name'],
      heroes[1]['display-name'],
    ];

    return {
      response: l10n.t(
          locale, `cmd.manage-events.add-result`,
          '{DATE}', l10n.formatDate(locale, new Date(newEvent.ts)),
          '{HEROES}', l10n.makeList(locale, heroDisplayNames),
      ),
      success: true,
    };
  } else {
    return {
      response: l10n.s(locale, 'cmd.manage-events.add-error'),
      success: false,
    };
  }
}

/**
 * Remove the last entry of events database
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 */
function remove(context) {
  const {locale} = context;

  const removedEvent = data.removeEvent();

  if (removedEvent.heroes.length) {
    const heroDisplayNames =
      removedEvent.heroes.map((h) => (
        l10n.s(locale, `hero.content.${h}`)['display-name']),
      );

    return {
      response: l10n.t(
          locale, `cmd.manage-events.remove-result`,
          '{DATE}', l10n.formatDate(locale, new Date(removedEvent.ts)),
          '{HEROES}', l10n.makeList(locale, heroDisplayNames),
      ),
      success: true,
    };
  } else {
    return {
      response: l10n.s(locale, 'cmd.manage-events.remove-error'),
      success: false,
    };
  }
}

/**
 * @param {CommandContext} context - Interaction context
 */
export function autocomplete(context) {
  const {interaction} = context;
  const {locale, options} = interaction;
  const focused = options.getFocused();
  const suggestions = l10n.autocomplete.suggestContent(
      locale,
      focused,
      'hero',
      'part-of',
  );

  if (suggestions) {
    interaction.respond(
        suggestions.map((content) => ({
          name: content.title,
          value: content.id,
        })),
    );
  } else interaction.respond([]);
}