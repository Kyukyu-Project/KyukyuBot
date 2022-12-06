/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {AttachmentBuilder} from 'discord.js';
import {data} from '../../src/data.js';
import {l10n} from '../../src/l10n.js';

const commandName = 'hero-events';
const cooldown  = 5;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {interaction} = context;
  const {options} = interaction;
  let actionResult;
  switch (options.getSubcommand()) {
    case 'current': actionResult = current(context); break;
    case 'stats': actionResult = stats(context, 13); break;
    case 'list': actionResult = list(context, 13); break;
    case 'find': actionResult = find(context); break;
    case 'download':
      const attachment = download(context);
      interaction.reply({files: [attachment]});
      return true;
  }

  interaction.reply(actionResult.response);

  return actionResult.success;
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

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 */
function current(context) {
  const events = data['hero-events'];
  const {locale} = context;
  const EVENT_DURATION = (7 * 24 * 60 - 1) * 60 * 1000;

  let response = '';

  const localTime = new Date();

  /** current time in UTC */
  const utcTime = Date.UTC(
      localTime.getUTCFullYear(),
      localTime.getUTCMonth(),
      localTime.getUTCDate(),
      localTime.getUTCHours(),
      localTime.getUTCMinutes(),
      0, 0,
  );

  /** current time in number */
  const nowTS = Number(utcTime);

  const thisEventIdx = events.findIndex((evt) => (
    (evt.ts <= nowTS) && (evt.ts + EVENT_DURATION >= nowTS)
  ));

  if (thisEventIdx === -1) {
    return {
      response: l10n.s(locale, 'cmd.hero-events.current-result.not-found'),
      success: false,
    };
  }

  const thisEvent = events[thisEventIdx];
  const eventStart = thisEvent.ts;
  const eventEnd = eventStart + EVENT_DURATION;

  /** @type {string} - List separator ('/') */
  const listSeparator = l10n.s(locale, 'cmd.hero-events.list-separator');

  const primaryHeroList = thisEvent
      .primaryHeroes
      .map((h) => l10n.s(locale, `hero.content.${h}`)['display-name'])
      .join(listSeparator);

  if (thisEvent.type === 'wof') {
    const secondaryHeroList = thisEvent
        .secondaryHeroes
        .map((h) => l10n.s(locale, `hero.content.${h}`)['display-name'])
        .join(listSeparator);

    response = l10n.t(
        locale, 'cmd.hero-events.current-result.current-wof',
        '{HERO}', primaryHeroList,
        '{HERO2}', secondaryHeroList,
    );
  } else {
    response = l10n.t(
        locale, 'cmd.hero-events.current-result.current-cm',
        '{HEROES}', primaryHeroList,
    );
  }

  const timeLeft = eventEnd - nowTS;
  // day in mS   : 24 * 60 * 60 * 1000 = 86400000
  // hour in mS  : 60 * 60 * 1000 = 3600000
  // minute in mS: 60 * 1000 = 60000
  const d = Math.floor( timeLeft / 86400000);
  const h = Math.floor((timeLeft - d * 86400000)/ 3600000 );
  const m = Math.floor((timeLeft - d * 86400000 - h * 3600000)/ 60000 );

  response += l10n.t(
      locale, 'cmd.hero-events.current-result.count-down',
      '{DAY}', l10n.formatNumber(locale, d),
      '{HOUR}', l10n.formatNumber(locale, h),
      '{MINUTE}', l10n.formatNumber(locale, m));

  if (thisEventIdx > 0) { // next event has been announced
    const nextEvent = events[thisEventIdx -1];

    const nextPrimaryHeroList = nextEvent
        .primaryHeroes
        .map((h) => l10n.s(locale, `hero.content.${h}`)['display-name'])
        .join(listSeparator);

    if (nextEvent.type === 'wof') {
      const nextSecondaryHeroList = nextEvent
          .secondaryHeroes
          .map((h) => l10n.s(locale, `hero.content.${h}`)['display-name'])
          .join(listSeparator);

      response += l10n.t(
          locale, 'cmd.hero-events.current-result.next-wof',
          '{HERO}', nextPrimaryHeroList,
          '{HERO2}', nextSecondaryHeroList,
      );
    } else {
      response += l10n.t(
          locale, 'cmd.hero-events.current-result.next-cm',
          '{HEROES}', nextPrimaryHeroList,
      );
    }
  }

  return {
    response: response,
    success: true,
  };
}

/**
 * @param {CommandContext} context - Interaction context
 * @param {number} count - Number of hero events to run stats on
 * @return {ActionResult}
 */
function stats(context, count) {
  const eventBase = data['hero-events'];
  const {locale} = context;

  const recentHeroes = eventBase
      .slice(0, count-1)
      .reduce((all, event) => all.concat(event.primaryHeroes), []);

  const heroStats = [...new Set(recentHeroes)]
      .map((hero) => {
        return {
          displayName: l10n.s(locale, 'hero.content.' + hero)['display-name'],
          found: recentHeroes.filter((h) => h === hero).length,
        };
      });

  const sortedByOccurrences = [
    heroStats.filter((h) => h.found === 1).map((h) => h.displayName),
    heroStats.filter((h) => h.found === 2).map((h) => h.displayName),
    heroStats.filter((h) => h.found === 3).map((h) => h.displayName),
    heroStats.filter((h) => h.found === 4).map((h) => h.displayName),
    heroStats.filter((h) => h.found === 5).map((h) => h.displayName),
    heroStats.filter((h) => h.found > 5).map((h) => h.displayName),
  ];

  let response = l10n.s(locale, 'cmd.hero-events.stats-result');

  /** @type {string} - List separator ('/') */
  const listSeparator = l10n.s(locale, 'cmd.hero-events.list-separator');

  if (sortedByOccurrences[0].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.1x',
          '{HEROES}', sortedByOccurrences[0].join(listSeparator),
      );
  }
  if (sortedByOccurrences[1].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.2x',
          '{HEROES}', sortedByOccurrences[1].join(listSeparator),
      );
  }
  if (sortedByOccurrences[2].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.3x',
          '{HEROES}', sortedByOccurrences[2].join(listSeparator),
      );
  }
  if (sortedByOccurrences[3].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.4x',
          '{HEROES}', sortedByOccurrences[3].join(listSeparator),
      );
  }
  if (sortedByOccurrences[4].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.5x',
          '{HEROES}', sortedByOccurrences[4].join(listSeparator),
      );
  }
  if (sortedByOccurrences[5].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.6x',
          '{HEROES}', sortedByOccurrences[5].join(listSeparator),
      );
  }

  return {
    response: response,
    success: true,
  };
}

/**
 * @param {CommandContext} context - Interaction context
 * @param {number} count - Number of hero events to list
 * @return {ActionResult}
 */
function list(context, count) {
  const eventBase = data['hero-events'];
  const {locale} = context;

  const lines = eventBase.slice(0, count-1).map((event) => {
    /** @type {string} - List separator ('/') */
    const listSeparator = l10n.s(locale, 'cmd.hero-events.list-separator');

    const primaryHeroList = event
        .primaryHeroes
        .map((h) => l10n.s(locale, `hero.content.${h}`)['display-name'])
        .join(listSeparator);

    if (event.type === 'wof' ) {
      const secondaryHeroList = event
          .secondaryHeroes
          .map((h) => l10n.s(locale, `hero.content.${h}`)['display-name'])
          .join(listSeparator);

      return l10n.t(
          locale, 'cmd.hero-events.list-result.wof',
          '{DATE}', l10n.formatDate(locale, new Date(event.ts)),
          '{HERO}', primaryHeroList,
          '{HERO2}', secondaryHeroList,
      );
    } else {
      return l10n.t(
          locale, 'cmd.hero-events.list-result.cm',
          '{DATE}', l10n.formatDate(locale, new Date(event.ts)),
          '{HEROES}', primaryHeroList,
      );
    }
  });

  lines.unshift(l10n.s(locale, 'cmd.hero-events.list-result'));

  return {
    response: lines.join('\n'),
    success: true,
  };
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 */
function find(context) {
  const {locale, interaction} = context;
  const {options} = interaction;
  /** @type {string} */ const query = options.getString('hero');

  const heroResult = l10n.autocomplete.getContent(
      locale,
      query,
      'hero',
      'part-of',
  );

  if (!heroResult) {
    return {
      response: l10n.t(
          locale, 'cmd.hero-events.find-result.not-found',
          '{HERO}', query,
      ),
      success: false,
    };
  }

  const heroName = heroResult['id'];
  const heroDisplayName = heroResult['display-name'];

  const eventBase = data['hero-events'];

  let foundEvents;

  if (heroName === 'athena') {
    foundEvents = [];
  } else {
    foundEvents = eventBase.filter((evt) => (
      evt.primaryHeroes.includes(heroName) ||
      (evt.secondaryHeroes && evt.secondaryHeroes.includes(heroName))
    ));
  }

  if (foundEvents.length === 0) {
    return {
      response: l10n.t(
          locale, 'cmd.hero-events.find-result.not-found',
          '{HERO}', heroDisplayName,
      ),
      success: false,
    };
  }

  const cm = l10n.s(locale, `card-master`);
  const wof = l10n.s(locale, `wheel-of-fortune`);
  const firstEvent = foundEvents[foundEvents.length-1];
  const cmCount = foundEvents.filter((evt)=>evt.type==='cm').length;
  const wofCount = foundEvents.filter((evt)=>evt.type==='wof').length;

  let response = l10n.t(
      locale, 'cmd.hero-events.find-result',
      '{HERO}', heroDisplayName,
      '{FIRST DATE}', l10n.formatDate(locale, new Date(firstEvent.ts)),
      '{FIRST TYPE}', (firstEvent.type === 'cm')?cm:wof,
      '{CM COUNT}', l10n.formatNumber(locale, cmCount),
      '{WOF COUNT}', l10n.formatNumber(locale, wofCount),
  );

  const cmTemplate = l10n.s(
      locale, 'cmd.hero-events.find-result.recent-cm',
  );
  const wofTemplate = l10n.s(
      locale, 'cmd.hero-events.find-result.recent-wof',
  );

  foundEvents.slice(0, 6-1).forEach( (event) => {
    response += l10n.r(
      (event.type == 'cm')?cmTemplate:wofTemplate,
      '{DATE}', l10n.formatDate(locale, new Date(event.ts)),
    );
  });

  return {
    response: response,
    success: true,
  };
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {AttachmentBuilder}
 */
function download(context) {
  const {locale} = context;
  const eventBase = data['hero-events'];

  const cm = l10n.s(locale, `card-master`);
  const wof = l10n.s(locale, `wheel-of-fortune`);

  const json = eventBase.map((e) => {
    const eventEntry = {
      date: l10n.formatDate(locale, new Date(e.ts)),
      type: (e.type == 'cm')?cm:wof,
      primaryHeroes: e.primaryHeroes.map(
          (h) => l10n.s(locale, `hero.content.${h}`)['display-name'],
      ),
    };
    if (e.secondaryHeroes) {
      eventEntry.secondaryHeroes = e.secondaryHeroes.map(
          (h) => l10n.s(locale, `hero.content.${h}`)['display-name'],
      );
    }
    return eventEntry;
  });

  return new AttachmentBuilder(
      Buffer.from(JSON.stringify(json, null, 2)),
      {name: 'aow-hero-events.json'},
  );
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
  autocomplete: autocomplete,
};
