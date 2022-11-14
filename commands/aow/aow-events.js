/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

// import {l10n} from '../../src/l10n.js';
import {
  getModuleDirectory,
  joinPath,
  readJson,
  resolvePath,
} from '../../src/utils.js';

export const commandName = 'aow-events';
export const cooldown  = 20;

const moduleDir = getModuleDirectory(import.meta);

/**
 * @param {Date} d - Date
 * @return {Date}
 */
function toUTCDate(d) {
  return Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      0, 0,
  );
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction, locale} = context;

  /** current time in UTC */
  const currentTime = toUTCDate(new Date());

  /** current time in number */
  const currentTS = Number(currentTime);

  const dataDir = resolvePath(moduleDir, '../../data/events/');

  /** @type {Array} */
  const communityEvents = readJson(joinPath(dataDir, 'community.json'));
  const clanEvents = readJson(joinPath(dataDir, 'clan.json'));
  const specialEvents = readJson(joinPath(dataDir, 'special.json'));
  const salesEvents = readJson(joinPath(dataDir, 'sales.json'));

  const allEvents = communityEvents
      .concat(clanEvents)
      .concat(specialEvents)
      .concat(salesEvents)
      .filter((event) => event.publish);

  const currentEvents = [];
  const upcomingEvents = [];
  const endedEvents = [];

  /**
   * Sort events
   * @param {Object} a - Event A
   * @param {Object} b - Event B
   * @return {number} - Negative if A is before B
   */
  function sort(a, b) {
    if (a.countdown > b.countdown) return 1;
    if (a.countdown < b.countdown) return -1;
    return 0;
  }

  /**
   * @param {number} countdown - countdown
   * @return {string}
   */
  function getCountDownString(countdown) {
    const D = 24 * 60 * 60 * 1000;
    const H = 60 * 60 * 1000;
    // const M = 60 * 1000;

    return (
      `__${Math.floor(countdown / D)}__d ` +
      `__${Math.floor((countdown % D) / H)}__h`
    );

    /*

    if (countdown < (5 * M)) {
      return '< 5m>';
    }

    if (countdown > D) {
      return (
        `__${Math.floor(countdown / D)}__d ` +
        `__${Math.floor((countdown % D) / H)}__h`
      );
    }

    if (countdown > H) {
      return (
        `__${Math.floor(countdown / H)}__h ` +
        `__${Math.floor((countdown % H) / M)}__m`
      );
    }

    if (countdown > M) {
      return `__${Math.floor(countdown / M)}__m`;
    }
    */
  }

  allEvents
      .forEach((event) => {
        const startTS = Date.parse(event.date.start);
        const endTS =
          event.date.end?
          Date.parse(event.date.end):
          (event.date.duration * 24 * 60 * 60 * 1000 + startTS);

        if (endTS > currentTS) {
          if (startTS <= currentTS) { // Ongoing events
            const countdown = endTS - currentTS;
            currentEvents.push(
                Object.assign({countdown: countdown}, event),
            );
          } else { // Future events
            const countdown = startTS - currentTS;
            upcomingEvents.push(
                Object.assign({countdown: countdown}, event),
            );
          }
        } else {
          // Recently ended events
          if ((currentTS - endTS) < 3 * 24 * 60 * 60 * 1000) {
            const countdown = currentTS - endTS;
            endedEvents.push(
                Object.assign({countdown: countdown}, event),
            );
          }
        }
      });

  upcomingEvents.sort(sort);
  currentEvents.sort(sort);
  endedEvents.sort(sort);

  const fields = [];

  if (currentEvents.length) {
    const lines = currentEvents.map((event) => (
      `${event.emoji} ` +
      (event.title[locale]?event.title[locale]:event.title['en-US']) +
      ` (ends in ${getCountDownString(event.countdown)})`
    ));
    const value = lines.join('\n');
    fields.push({name: 'Ongoing events', value: value});
  }

  if (upcomingEvents.length) {
    const lines = upcomingEvents.map((event) => (
      `${event.emoji} ` +
      (event.title[locale]?event.title[locale]:event.title['en-US']) +
      ` (starts in ${getCountDownString(event.countdown)})`
    ));
    const value = lines.join('\n');
    fields.push({name: 'Upcoming events', value: value});
  }

  if (endedEvents.length) {
    const lines = endedEvents.map((event) => (
      `${event.emoji} ` +
      (event.title[locale]?event.title[locale]:event.title['en-US']) +
      ` (ended ${getCountDownString(event.countdown)} ago)`
    ));
    const value = lines.join('\n');
    fields.push({name: 'Just ended', value: value});
  }

  interaction.reply({embeds: [{fields: fields}]});

  return true;
}
