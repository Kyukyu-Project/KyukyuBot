/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {data} from '../../src/data.js';
import {l10n} from '../../src/l10n.js';

const commandName = 'events-admin';
const cooldown  = 0;
const ephemeral = false;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
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
      response: l10n.s(locale, 'cmd.events-admin.add-error'),
      success: false,
    };
  }

  const newEvent = data.addCmEvent(heroes.map((h) => h.id));

  if (newEvent.primaryHeroes.length) {
    /** @type {string} - List separator ('/') */
    const listSeparator = l10n.s(locale, 'cmd.hero-events.list-separator');

    const primaryHeroList = heroes
        .map((el) => el['display-name'])
        .join(listSeparator);

    return {
      response: l10n.t(
          locale, `cmd.events-admin.add-result`,
          '{DATE}', l10n.formatDate(locale, new Date(newEvent.ts)),
          '{HEROES}', primaryHeroList,
      ),
      success: true,
    };
  } else {
    return {
      response: l10n.s(locale, 'cmd.events-admin.add-error'),
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

  const heroes = ['hero1', 'hero2', 'hero3'].map((field) => (
    l10n
        .autocomplete
        .getContent(locale, options.getString(field), 'hero', 'part-of')
  ));

  if (heroes.includes(undefined)) {
    return {
      response: l10n.s(locale, 'cmd.events-admin.add-error'),
      success: false,
    };
  }

  const newEvent = data.addWofEvent(heroes.map((h) => h.id));

  if (newEvent.primaryHeroes.length) {
    /** @type {string} - List separator ('/') */
    const listSeparator = l10n.s(locale, 'cmd.hero-events.list-separator');

    const heroList = heroes.map((h) => (
      l10n.s(locale, `hero.content.${h.id}`)['display-name']),
    ).join(listSeparator);

    return {
      response: l10n.t(
          locale, `cmd.events-admin.add-result`,
          '{DATE}', l10n.formatDate(locale, new Date(newEvent.ts)),
          '{HEROES}', heroList,
      ),
      success: true,
    };
  } else {
    return {
      response: l10n.s(locale, 'cmd.events-admin.add-error'),
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

  if (removedEvent.primaryHeroes.length) {
    /** @type {string} - List separator ('/') */
    const listSeparator = l10n.s(locale, 'cmd.hero-events.list-separator');

    const heroList = removedEvent.primaryHeroes.map((h) => (
      l10n.s(locale, `hero.content.${h}`)['display-name']),
    ).join(listSeparator);

    return {
      response: l10n.t(
          locale, `cmd.events-admin.remove-result`,
          '{DATE}', l10n.formatDate(locale, new Date(removedEvent.ts)),
          '{HEROES}', heroList,
      ),
      success: true,
    };
  } else {
    return {
      response: l10n.s(locale, 'cmd.events-admin.remove-error'),
      success: false,
    };
  }
}

/**
 * Run autocomplete
 * @param {CommandContext} context - Interaction context
 */
function autocomplete(context) {
  const {interaction} = context;
  const locale = interaction.locale;
  const query = interaction.options.getFocused();

  let options =
    l10n.autocomplete.suggestContent(locale, query, 'hero', 'part-of');

  if (options) {
    options = options.map((c) => ({name: c.title, value: c.id}));
  } else {
    options = [];
  }

  interaction.respond(options);
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
  autocomplete: autocomplete,
};
