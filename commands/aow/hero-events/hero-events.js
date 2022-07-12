/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {readFileSync, writeFileSync} from 'fs';
import {formatDate} from '../../../utils/utils.js';
import {l10n} from '../../../src/l10n.js';

import heroBase from '../../../data/heroes.js';

/* **************** Event Management **************** */

/**
 * @typedef {Object} Event
 * @property {number} ts - start date timestamp
 * @property {string} date - start date in human readable form
 * @property {"cm"|"wof"} type - event type
 * @property {string[]} heroes - list of heroes
 */

const eventFilePath = new URL('./hero-events.json', import.meta.url);

/** @type {Event[]} */
const events = JSON.parse(readFileSync(eventFilePath, 'utf8'));

/**
 * @type {{name:string, rarity: string}[]}
 * a list of all heroes in past events
 * */
let pastEventHeroes = [];

/** @type {string[]} - a list of all legendary heroes in past */
let pastEventLegendaryHeroes = [];

/** @type {string[]} - a list of all epic heroes in past */
let pastEventEpicHeroes = [];

let recentEventStats13;

let recentEventList6;
let recentEventList12;

statsRefresh();

/** Refresh stats */
function statsRefresh() {
  const allPastEventHeroes = [...new Set(
      events.reduce((all, event) => all.concat(event.heroes), [])),
  ];

  pastEventHeroes = allPastEventHeroes.map((hero) => (
    {
      name: hero,
      rarity: heroBase.find((data) => data.name === hero).rarity,
    }
  ));

  pastEventLegendaryHeroes = pastEventHeroes
      .filter((h) => (h.name !== 'athena') && (h.rarity === 'legendary'))
      .map((h) => h.name);

  pastEventEpicHeroes = pastEventHeroes
      .filter((h) => (h.rarity === 'epic'))
      .map((h) => h.name);

  recentEventStats13 = getRecentEventStats(13);
  recentEventList6 = getRecentEventList('*', 6);
  recentEventList12 = getRecentEventList('*', 12);
}

/**
 * Get stats of recent events
 * @param {number} count - how many events to run stats on
 * @return {object}
 */
function getRecentEventStats(count) {
  const recentHeroes = events
      .slice(0, count-1)
      .reduce((all, event) => all.concat(event.heroes), []);

  const heroStats = [...new Set(recentHeroes)]
      .filter((hero) =>
        heroBase.find((data) => data.name === hero).rarity === 'legendary',
      )
      .map((hero) => {
        return {
          name: hero,
          occurrences: recentHeroes.filter((h) => h == hero).length,
        };
      });

  return [
    heroStats.filter((h) => h.occurrences === 1).map((h) => h.name),
    heroStats.filter((h) => h.occurrences === 2).map((h) => h.name),
    heroStats.filter((h) => h.occurrences === 3).map((h) => h.name),
    heroStats.filter((h) => h.occurrences === 4).map((h) => h.name),
    heroStats.filter((h) => h.occurrences === 5).map((h) => h.name),
    heroStats.filter((h) => h.occurrences > 5).map((h) => h.name),
  ];
}

/**
  * Get list of recent events
  * @param {string} hero - hero to search for ("*" for all heroes)
  * @param {number} count - how many events to list
  * @return {object}
  */
function getRecentEventList(hero, count) {
  if (hero === 'athena') return [];

  return (
      (hero === '*')?
      events:
      events.filter((evt) => evt.heroes.includes(hero))
  ).slice(0, count-1);
}

/**
 * Add a new event
 * @param {string[]} heroesToAdd - heroes to add
 * @return {{date: string, heroes: string[]}}
 */
function addEvent(heroesToAdd) {
  heroesToAdd = heroesToAdd.filter(
      (hero) => heroBase.findIndex((data) => data.name === hero) !== -1);

  if (heroesToAdd.length == 0) return {date: '', heroes: []};

  let eventDate;
  if (events.length == 0) {
    eventDate = new Date(Date.UTC(2020, 4, 19));
  } else {
    eventDate = new Date(events[0].ts);
    eventDate.setUTCDate(eventDate.getUTCDate() + 7);
  }


  /** @type Event */
  const newEvent =
    {
      ts: Number(eventDate),
      date: formatDate(eventDate, 'ISO'),
      type: (heroesToAdd.length > 3)?'cm':'wof',
      heroes: heroesToAdd,
    };

  events.unshift(newEvent);
  writeFileSync(eventFilePath, JSON.stringify(events, null, 2));
  statsRefresh();

  return newEvent;
}

/**
 * Delete an event
 * @return {{date: string, heroes: string[]}}
 */
function removeEvent() {
  if (events.length == 0) return {date: 0, heroes: []};

  const lastEvent = events.shift();
  writeFileSync(eventFilePath, JSON.stringify(events, null, 2));
  statsRefresh();

  return lastEvent;
}

/* ***************** Slash Command  ***************** */

import {COMMAND_PERM} from '../../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageAttachment} from 'discord.js';

export const canonName = 'aow.hero-event';
export const name = 'hero-event';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const scInfoLabel      = 'info';
const scListLabel      = 'list';
const scStatsLabel     = 'stats';
const scFindLabel      = 'find-legendary';
const scFind2Label     = 'find-epic';
const scDownloadLabel  = 'download';
const scAddWheelLabel  = 'add-wheel';
const scAddCMLabel     = 'add-cm';
const scRemoveLabel    = 'remove';
const optHeroLabel     = 'hero';

/**
 * @param {CommandContext|IContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang, guild} = context;

  const findChoices =
    pastEventLegendaryHeroes
        .map((hero)=> [l10n.s(lang, `hero-display-names.${hero}`), hero])
        .sort((a, b) => a[0].localeCompare(b[0], lang));

  const find2Choices =
    pastEventEpicHeroes
        .map((hero)=> [l10n.s(lang, `hero-display-names.${hero}`), hero])
        .sort((a, b) => a[0].localeCompare(b[0], lang));

  const addChoices = heroBase
      .filter((data) =>
        data.rarity ==='legendary' &&
        (data.released === true || data.released === undefined) &&
        (data.exclusive === false || data.exclusive === undefined),
      )
      .map((data)=> [
        l10n.s(lang, `hero-display-names.${data.name}`),
        data.name,
      ])
      .sort((a, b) => a[0].localeCompare(b[0], lang));

  const addChoices2 = heroBase
      .filter((data) => data.rarity ==='epic')
      .map((data)=> [
        l10n.s(lang, `hero-display-names.${data.name}`),
        data.name,
      ])
      .sort((a, b) => a[0].localeCompare(b[0], lang));

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const scInfoHint = l10n.s(lang, `commands.${canonName}.sc-info-hint`);
  const scListHint = l10n.s(lang, `commands.${canonName}.sc-list-hint`);
  const scStatsHint = l10n.s(lang, `commands.${canonName}.sc-stats-hint`);
  const scFindHint =
    l10n.s(lang, `commands.${canonName}.sc-find-legendary-hint`);
  const scFind2Hint =
    l10n.s(lang, `commands.${canonName}.sc-find-epic-hint`);
  const scDownloadHint = l10n.s(lang, `commands.${canonName}.sc-download-hint`);
  const scAddWoFHint = l10n.s(lang, `commands.${canonName}.sc-add-wof-hint`);
  const scAddCMHint = l10n.s(lang, `commands.${canonName}.sc-add-cm-hint`);
  const scRemoveHint = l10n.s(lang, `commands.${canonName}.sc-remove-hint`);
  const optHeroHint  = l10n.s(lang, `commands.${canonName}.opt-hero-hint`);

  const ownerGuild = (guild.id == client.ownerGuildId);

  const slashCommand = new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addSubcommand((command) => command
          .setName(scInfoLabel)
          .setDescription(scInfoHint),
      )
      .addSubcommand((command) => command
          .setName(scListLabel)
          .setDescription(scListHint),
      )
      .addSubcommand((command) => command
          .setName(scStatsLabel)
          .setDescription(scStatsHint),
      )
      .addSubcommand((command) => command
          .setName(scFindLabel)
          .setDescription(scFindHint)
          .addStringOption((option) => option
              .setName(optHeroLabel)
              .setDescription(optHeroHint)
              .setRequired(true)
              .addChoices(findChoices),
          ),
      )
      .addSubcommand((command) => command
          .setName(scFind2Label)
          .setDescription(scFind2Hint)
          .addStringOption((option) => option
              .setName(optHeroLabel)
              .setDescription(optHeroHint)
              .setRequired(true)
              .addChoices(find2Choices),
          ),
      )
      .addSubcommand((command) => command
          .setName(scDownloadLabel)
          .setDescription(scDownloadHint),
      );

  if (ownerGuild) {
    slashCommand
        .addSubcommand((command) => command
            .setName(scAddCMLabel)
            .setDescription(scAddCMHint)
            .addStringOption((option) => option
                .setName('hero1')
                .setDescription('hero1')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero2')
                .setDescription('hero2')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero3')
                .setDescription('hero3')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero4')
                .setDescription('hero4')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero5')
                .setDescription('hero5')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero6')
                .setDescription('hero6')
                .setRequired(true)
                .addChoices(addChoices),
            ),
        )
        .addSubcommand((command) => command
            .setName(scAddWheelLabel)
            .setDescription(scAddWoFHint)
            .addStringOption((option) => option
                .setName('hero1')
                .setDescription('hero1')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero2')
                .setDescription('hero2')
                .setRequired(true)
                .addChoices(addChoices2),
            ),
        )
        .addSubcommand((command) => command
            .setName(scRemoveLabel)
            .setDescription(scRemoveHint),
        );
  }

  return slashCommand;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;

  /** @type {ActionResult} */ let actionResult;

  const subCommand = interaction.options.getSubcommand();

  /** Send content which uses external emoji */
  function richReply() {
    // cannot send Embed using interaction.reply due to Discord API bug #2612
    interaction.channel.send({
      content: l10n.t(
          lang, 'messages.use-command',
          '{PREFIX}', '/',
          '{COMMAND}', name,
          '{USER ID}', interaction.user.id),
      embeds: [{description: actionResult.response}],
    });
    interaction.reply({
      content: l10n.s(lang, 'messages.info-sent'),
      ephemeral: true,
    });
  }

  switch (subCommand) {
    case scInfoLabel:
      actionResult = view(context);
      interaction.reply(actionResult.response);
      return actionResult.success;
    case scListLabel:
      actionResult = listAllRecent(context);
      richReply();
      return actionResult.success;
    case scStatsLabel:
      actionResult = stats(context);
      interaction.reply(actionResult.response);
      return actionResult.success;
    case scDownloadLabel:
      const buffer = download(context);
      const file = new MessageAttachment(buffer, 'aow-hero-events.json');
      await interaction.reply({files: [file], ephemeral: true});
      return true;
    case scFindLabel:
      actionResult = getEventInfo(
          context, interaction.options.getString(optHeroLabel));
      richReply();
      return actionResult.success;
    case scFind2Label:
      actionResult = listRecent(
          context, interaction.options.getString(optHeroLabel));
      richReply();
      return actionResult.success;
  }

  if (!context.hasOwnerPermission) {
    const response = l10n.s(lang, 'messages.no-permission');
    interaction.reply({content: response, ephemeral: true});
    return false;
  }

  switch (subCommand) {
    case scAddWheelLabel:
      actionResult = add(
          context,
          interaction.options.getString('hero1'),
          interaction.options.getString('hero2'),
      );
      interaction.reply({content: actionResult.response, ephemeral: true});
      return actionResult.success;
    case scAddCMLabel:
      actionResult = add(
          context,
          interaction.options.getString('hero1'),
          interaction.options.getString('hero2'),
          interaction.options.getString('hero3'),
          interaction.options.getString('hero4'),
          interaction.options.getString('hero5'),
          interaction.options.getString('hero6'),
      );
      interaction.reply({content: actionResult.response, ephemeral: true});
      return actionResult.success;
    case scRemoveLabel:
      actionResult = remove(context);
      interaction.reply({content: actionResult.response, ephemeral: true});
      return actionResult.success;
  }
}

/**
 * @param {CommandContext|IContext} context
 * @return {ActionResult}
 */
function view(context) {
  const {lang} = context;
  const EVENT_DURATION = (7 * 24 * 60 - 1) * 60 * 1000;

  const getHeroDisplayNames = (event) => {
    if (event.heroes.length === 2 ) {
      const hero1Rarity =
          heroBase.find((data) => data.name === event.heroes[0]).rarity;

      if (hero1Rarity === 'epic') {
        return [
          l10n.s(lang, `hero-display-names.${event.heroes[1]}`),
          l10n.s(lang, `hero-display-names.${event.heroes[2]}`),
        ];
      } else {
        return [
          l10n.s(lang, `hero-display-names.${event.heroes[0]}`),
          l10n.s(lang, `hero-display-names.${event.heroes[1]}`),
        ];
      }
    } else {
      return event.heroes.map((h) => l10n.s(lang, `hero-display-names.${h}`));
    }
  };

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

  /** latest event entry */
  const latestEvent = events[0];

  let eventStart = latestEvent.ts;
  let eventEnd = eventStart + EVENT_DURATION;

  let lastEvent = undefined;
  let thisEvent = undefined;
  let nextEvent = undefined;

  if (eventEnd < nowTS) { // all events have passed!
    lastEvent = latestEvent;
  } else {
    if (eventStart > nowTS) { // next event has been announced
      thisEvent = events[1];
      eventStart = thisEvent.ts;
      eventEnd = eventStart + EVENT_DURATION;
      nextEvent = latestEvent;
    } else {
      thisEvent = latestEvent;
    }
  }

  if (lastEvent) {
    const heroNames = getHeroDisplayNames(lastEvent);
    if (heroNames.length === 2 ) {
      response = l10n.t(
          lang, `commands.${canonName}.response-last-wof`,
          '{HERO}', heroNames[0], '{HERO2}', heroNames[1],
      );
    } else {
      response = l10n.t(
          lang, `commands.${canonName}.response-last-cm`,
          '{HEROES}', l10n.join(lang, heroNames),
      );
    }
  }

  if (thisEvent) {
    const heroNames = getHeroDisplayNames(thisEvent);
    if (heroNames.length === 2 ) {
      response = l10n.t(
          lang, `commands.${canonName}.response-current-wof`,
          '{HERO}', heroNames[0], '{HERO2}', heroNames[1],
      );
    } else {
      response = l10n.t(
          lang, `commands.${canonName}.response-current-cm`,
          '{HEROES}', l10n.join(lang, heroNames),
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
        lang,
        `commands.${canonName}.response-count-down`,
        '{DAY}', d,
        '{HOUR}', h,
        '{MINUTE}', m);
  }

  if (nextEvent) { // next event has been announced
    const heroNames = getHeroDisplayNames(nextEvent);
    if (heroNames.length === 2 ) {
      response += l10n.t(
          lang, `commands.${canonName}.response-next-wof`,
          '{HERO}', heroNames[0], '{HERO2}', heroNames[1],
      );
    } else {
      response += l10n.t(
          lang, `commands.${canonName}.response-next-cm`,
          '{HEROES}', l10n.join(lang, heroNames),
      );
    }
  } else if (thisEvent) { // next event has not been announced
    const nag = new Date(eventStart);
    nag.setUTCDate(nag.getUTCDate() + 2);
    if (nowTS > Number(nag)) {
      response +=
        l10n.s(lang, `commands.${canonName}.response-patience-padawan`);
    }
  }

  return {
    response: response,
    success: true,
  };
}


/**
 * @param {CommandContext|IContext} context
 * @return {ActionResult}
 */
function stats(context) {
  const {lang} = context;
  const getHeroList = (heroes) => l10n.join(
      lang, heroes.map((h) => l10n.s(lang, `hero-display-names.${h}`)),
  );

  const recentEventStats = recentEventStats13;
  let response = l10n.s(lang, `commands.${canonName}.response-recent-13`);

  if (recentEventStats[0].length > 0) {
    response += l10n.t(
        lang, `commands.${canonName}.response-recent-1x`,
        '{HEROES}', getHeroList(recentEventStats[0]),
    );
  }
  if (recentEventStats[1].length > 0) {
    response += l10n.t(
        lang, `commands.${canonName}.response-recent-2x`,
        '{HEROES}', getHeroList(recentEventStats[1]),
    );
  }
  if (recentEventStats[2].length > 0) {
    response += l10n.t(
        lang, `commands.${canonName}.response-recent-3x`,
        '{HEROES}', getHeroList(recentEventStats[2]),
    );
  }
  if (recentEventStats[3].length > 0) {
    response += l10n.t(
        lang, `commands.${canonName}.response-recent-4x`,
        '{HEROES}', getHeroList(recentEventStats[3]),
    );
  }
  if (recentEventStats[4].length > 0) {
    response += l10n.t(
        lang, `commands.${canonName}.response-recent-5x`,
        '{HEROES}', getHeroList(recentEventStats[4]),
    );
  }
  if (recentEventStats[5].length > 0) {
    response += l10n.t(
        lang, `commands.${canonName}.response-recent-6x`,
        '{HEROES}', getHeroList(recentEventStats[5]),
    );
  }

  return {
    response: response,
    success: true,
  };
}

/**
 * List recent events of all heroes
 * @param {CommandContext|IContext} context
 * @return {ActionResult}
 */
function listAllRecent(context) {
  const {lang} = context;

  const eventList =
    context.hasOwnerPermission?recentEventList12:recentEventList6;

  const dateLocale = l10n.s(lang, 'date-locale');

  const lines = eventList.map((event) => {
    if (event.heroes.length === 2 ) {
      const hero1Rarity =
          heroBase.find((data) => data.name === event.heroes[0]).rarity;

      if (hero1Rarity === 'epic') {
        return l10n.t(
            lang,
            `commands.${canonName}.response-list-wof`,
            '{DATE}', formatDate(new Date(event.ts), dateLocale),
            '{HERO}', l10n.s(lang, `hero-display-names.${event.heroes[1]}`),
            '{HERO2}', l10n.s(lang, `hero-display-names.${event.heroes[0]}`),
        );
      } else {
        return l10n.t(
            lang,
            `commands.${canonName}.response-list-wof`,
            '{DATE}', formatDate(new Date(event.ts), dateLocale),
            '{HERO}', l10n.s(lang, `hero-display-names.${event.heroes[0]}`),
            '{HERO2}', l10n.s(lang, `hero-display-names.${event.heroes[1]}`),
        );
      }
    } else {
      return l10n.t(
          lang,
          `commands.${canonName}.response-list-cm`,
          '{DATE}', formatDate(new Date(event.ts), dateLocale),
          '{HEROES}',
          l10n.join(
              lang,
              event.heroes.map((h) => l10n.s(lang, `hero-display-names.${h}`)),
          ),
      );
    }
  });

  lines.unshift(l10n.s(lang, `commands.${canonName}.response-list`));

  return {
    response: lines.join('\n'),
    success: true,
  };
}

/**
 * List recent events of a hero
 * @param {CommandContext|IContext} context
 * @param {string} hero
 * @return {ActionResult}
 */
function listRecent(context, hero) {
  const {lang} = context;

  const eventList =
    (context.hasOwnerPermission|context.hasAdminPermission)?
    getRecentEventList(hero, 12):
    getRecentEventList(hero, 6);

  if (eventList.length === 0) {
    return {
      response: l10n.t(
          lang, `commands.${canonName}.response-list-none`,
          '{HERO}', l10n.s(lang, `hero-display-names.${hero}`),
      ),
      success: false,
    };
  }

  const dateLocale = l10n.s(lang, 'date-locale');
  const lines = eventList.map((event) => {
    if (event.heroes.length === 2 ) {
      return l10n.t(
          lang, `commands.${canonName}.response-find-wof`,
          '{DATE}', formatDate(new Date(event.ts), dateLocale),
      );
    } else {
      return l10n.t(
          lang, `commands.${canonName}.response-find-cm`,
          '{DATE}', formatDate(new Date(event.ts), dateLocale),
      );
    }
  });

  lines.unshift(l10n.t(
      lang, `commands.${canonName}.response-find`,
      '{HERO}', l10n.s(lang, `hero-display-names.${hero}`),
  ));

  return {
    response: lines.join('\n'),
    success: true,
  };
}

/**
 * Get event information of a legendary hero
 * @param {CommandContext|IContext} context
 * @param {string} hero
 * @return {ActionResult}
 */
function getEventInfo(context, hero) {
  const {lang} = context;
  const eventList =
    (hero === 'athena')?[]:events.filter((evt) => evt.heroes.includes(hero));

  const recentEventList =
    (context.hasOwnerPermission|context.hasAdminPermission)?
    eventList.slice(0, 12-1):
    eventList.slice(0, 6-1);

  if (recentEventList.length === 0) {
    return {
      response: l10n.t(
          lang, `commands.${canonName}.response-list-none`,
          '{HERO}', l10n.s(lang, `hero-display-names.${hero}`),
      ),
      success: false,
    };
  }

  const dateLocale = l10n.s(lang, 'date-locale');
  const lines = recentEventList.map((event) => {
    if (event.heroes.length === 2 ) {
      return l10n.t(
          lang, `commands.${canonName}.response-find-wof`,
          '{DATE}', formatDate(new Date(event.ts), dateLocale),
      );
    } else {
      return l10n.t(
          lang, `commands.${canonName}.response-find-cm`,
          '{DATE}', formatDate(new Date(event.ts), dateLocale),
      );
    }
  });

  const cm = l10n.s(lang, `commands.${canonName}.cm`);
  const wof = l10n.s(lang, `commands.${canonName}.wof`);

  const firstEvent = eventList[eventList.length-1];
  const firstDate = formatDate(new Date(firstEvent.ts), dateLocale);
  const firstType = (firstEvent.type === 'cm')?cm:wof;

  const lastEvent = eventList[0];
  const lastDate = formatDate(new Date(lastEvent.ts), dateLocale);
  const lastType = (lastEvent.type === 'cm')?cm:wof;
  const cmCount = eventList.filter((evt)=>evt.type==='cm').length;
  const wofCount = eventList.filter((evt)=>evt.type==='wof').length;

  lines.unshift(l10n.t(
      lang,
      `commands.${canonName}.response-find-legendary`,
      '{HERO}', l10n.s(lang, `hero-display-names.${hero}`),
      '{FIRST DATE}', firstDate,
      '{FIRST TYPE}', firstType,
      '{LAST DATE}', lastDate,
      '{LAST TYPE}', lastType,
      '{CM COUNT}', cmCount,
      '{WOF COUNT}', wofCount,
  ));

  return {
    response: lines.join('\n'),
    success: true,
  };
}

/**
 * @param {CommandContext|IContext} context
 * @param {string} heroes
 * @return {ActionResult}
 */
function add(context, ...heroes) {
  const {lang} = context;

  const result = addEvent(heroes);
  if (result.heroes.length) {
    const heroDisplayNames = l10n.join(
        lang,
        result.heroes.map((h) => l10n.s(lang, `hero-display-names.${h}`)),
    );

    const dateLocale = l10n.s(lang, 'date-locale');
    return {
      response: l10n.t(
          lang,
          `commands.${canonName}.response-added`,
          '{DATE}', formatDate(new Date(result.ts), dateLocale),
          '{HEROES}', heroDisplayNames,
      ),
      success: true,
    };
  } else {
    return {
      response: l10n.s(lang, `commands.${canonName}.error-add`),
      success: false,
    };
  }
}

/**
 * @param {CommandContext|IContext} context
 * @return {ActionResult}
 */
function remove(context) {
  const {lang} = context;

  const result = removeEvent();
  if (result.heroes.length) {
    const heroDisplayNames = l10n.join(
        lang,
        result.heroes.map((h) => l10n.s(lang, `hero-display-names.${h}`)),
    );

    const dateLocale = l10n.s(lang, 'date-locale');
    return {
      response: l10n.t(
          lang,
          `commands.${canonName}.response-remove`,
          '{DATE}', formatDate(new Date(result.ts), dateLocale),
          '{HEROES}', heroDisplayNames,
      ),
      success: true,
    };
  } else {
    return {
      response: l10n.s(lang, `commands.${canonName}.error-remove`),
      success: false,
    };
  }
}

/**
 * @param {CommandContext|IContext} context
 * @return {Buffer}
 */
function download(context) {
  const {lang} = context;

  const dateLocale = l10n.s(lang, 'date-locale');

  const json = events.map((evt) => {
    return {
      date: formatDate(new Date(evt.ts), dateLocale),
      heroes: evt.heroes,
    };
  });

  return Buffer.from(JSON.stringify(json, null, 2));
}
