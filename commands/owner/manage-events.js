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
    l10n.findHeroByDisplayName(locale, options.getString('hero1')),
    l10n.findHeroByDisplayName(locale, options.getString('hero2')),
    l10n.findHeroByDisplayName(locale, options.getString('hero3')),
    l10n.findHeroByDisplayName(locale, options.getString('hero4')),
    l10n.findHeroByDisplayName(locale, options.getString('hero5')),
    l10n.findHeroByDisplayName(locale, options.getString('hero6')),
  ];

  if (heroes.includes(undefined)) {
    return {
      response: l10n.s(locale, 'cmd.manage-events.add-error'),
      success: false,
    };
  }

  const newEvent = data.addCmEvent(heroes.map((el) => el[0]));

  if (newEvent.heroes.length) {
    const heroDisplayNames = heroes.map((el) => el[1]);

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

  const heroes = [
    l10n.findHeroByDisplayName(locale, options.getString('hero1')),
    l10n.findHeroByDisplayName(locale, options.getString('hero2')),
  ];

  if ((heroes[0] === undefined) || (heroes[1] === undefined)) {
    return {
      response: l10n.s(locale, 'cmd.manage-events.add-error'),
      success: false,
    };
  }

  const newEvent = data.addWofEvent([heroes[0][0], heroes[1][0]]);

  if (newEvent.heroes.length) {
    const heroDisplayNames = [heroes[0][1], heroes[1][1]];

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
      removedEvent.heroes.map((h) => l10n.findHeroByName(locale, h)[1]);

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
      'autocomplete.hero',
      'part-of',
  );
  interaction.respond(suggestions);
}
