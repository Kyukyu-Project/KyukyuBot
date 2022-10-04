/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {AttachmentBuilder} from 'discord.js';
import {data} from '../../src/data.js';
import {l10n} from '../../src/l10n.js';

export const commandName = 'hero-events';
export const cooldown  = 5;
const ephemeral = false;

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
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
      interaction.reply({
        files: [attachment],
        ephemeral: ephemeral},
      );
      return true;
  }

  interaction.reply({
    content: actionResult.response,
    ephemeral: ephemeral,
  });

  return actionResult.success;
}

/**
 * @param {CommandContext} context - Interaction context
 */
export function autocomplete(context) {
  const {interaction} = context;
  const {locale, options} = interaction;
  const focused = options.getFocused();
  const searchResult = l10n.autocomplete(locale, 'autocomplete.hero', focused);
  interaction.respond(searchResult);
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

  let heroDisplayNames = thisEvent.heroes.map((h) =>
    l10n.findHeroByName(locale, h)[1]);

  if (thisEvent.type === 'wof') {
    response = l10n.t(
        locale, 'cmd.hero-events.current-result.current-wof',
        '{HERO}', heroDisplayNames[0],
        '{HERO2}', heroDisplayNames[1],
    );
  } else {
    response = l10n.t(
        locale, 'cmd.hero-events.current-result.current-cm',
        '{HEROES}', l10n.makeList(locale, heroDisplayNames),
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

    heroDisplayNames = nextEvent.heroes.map(
        (h) => l10n.findHeroByName(locale, h)[1],
    );

    if (nextEvent.type === 'wof') {
      response += l10n.t(
          locale, 'cmd.hero-events.current-result.next-wof',
          '{HERO}', heroDisplayNames[0],
          '{HERO2}', heroDisplayNames[1],
      );
    } else {
      response += l10n.t(
          locale, 'cmd.hero-events.current-result.next-cm',
          '{HEROES}', l10n.makeList(locale, heroDisplayNames),
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
  const heroBase = data['heroes'];
  const {locale} = context;

  const recentHeroes = eventBase
      .slice(0, count-1)
      .reduce((all, event) => all.concat(event.heroes), []);

  const heroStats = [...new Set(recentHeroes)]
      .filter((hero) =>
        heroBase.find((data) => data.name === hero).rarity === 'legendary',
      )
      .map((hero) => {
        return {
          displayName: l10n.findHeroByName(locale, hero)[1],
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

  if (sortedByOccurrences[0].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.1x',
          '{HEROES}', l10n.makeList(locale, sortedByOccurrences[0]),
      );
  }
  if (sortedByOccurrences[1].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.2x',
          '{HEROES}', l10n.makeList(locale, sortedByOccurrences[1]),
      );
  }
  if (sortedByOccurrences[2].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.3x',
          '{HEROES}', l10n.makeList(locale, sortedByOccurrences[2]),
      );
  }
  if (sortedByOccurrences[3].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.4x',
          '{HEROES}', l10n.makeList(locale, sortedByOccurrences[3]),
      );
  }
  if (sortedByOccurrences[4].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.5x',
          '{HEROES}', l10n.makeList(locale, sortedByOccurrences[4]),
      );
  }
  if (sortedByOccurrences[5].length > 0) {
    response +=
      l10n.t(
          locale, 'cmd.hero-events.stats-result.6x',
          '{HEROES}', l10n.makeList(locale, sortedByOccurrences[5]),
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
    const heroDisplayNames =
          event.heroes.map((h) => l10n.findHeroByName(locale, h)[1]);

    if (event.type === 'wof' ) {
      return l10n.t(
          locale, 'cmd.hero-events.list-result.wof',
          '{DATE}', l10n.formatDate(locale, new Date(event.ts)),
          '{HERO}', heroDisplayNames[0],
          '{HERO2}', heroDisplayNames[1],
      );
    } else {
      return l10n.t(
          locale, 'cmd.hero-events.list-result.cm',
          '{DATE}', l10n.formatDate(locale, new Date(event.ts)),
          '{HEROES}', l10n.makeList(locale, heroDisplayNames),
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

  const hero = l10n
      .findHeroByDisplayName(locale, interaction.options.getString('hero'));

  if (!hero) {
    return {
      response: l10n.t(
          locale, 'cmd.hero-events.find-result.not-found',
          '{HERO}', interaction.options.getString('hero'),
      ),
      success: false,
    };
  }

  const [heroName, heroDisplayName] = hero;

  const eventBase = data['hero-events'];

  let foundEvents;

  if (heroName === 'athena') {
    foundEvents = [];
  } else {
    foundEvents = eventBase.filter((evt) => evt.heroes.includes(heroName));
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

  const json = eventBase.map((event) => ({
    date: l10n.formatDate(locale, new Date(event.ts)),
    type: (event.type == 'cm')?cm:wof,
    heroes: event.heroes.map((h) => l10n.findHeroByName(locale, h)[1]),
  }));

  return new AttachmentBuilder(
      Buffer.from(JSON.stringify(json, null, 2)),
      {name: 'aow-hero-events.json'},
  );
}
