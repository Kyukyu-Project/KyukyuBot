/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {l10n} from '../../src/l10n.js';
import {
  getModuleDirectory,
  joinPath,
  readJson,
  resolvePath,
} from '../../src/utils.js';

const commandName = 'aow-events';
const cooldown  = 20;

const moduleDir = getModuleDirectory(import.meta);
const dataDir = resolvePath(moduleDir, '../../data/events/');
const dataFilePaths =
  [
    'community.json',
    'ranking.json',
    'special.json',
    'sales.json',
  ].map((fName) => joinPath(dataDir, fName));

const FireEmoji = '<a:brifire:1052437452587028571>';

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
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {interaction, locale} = context;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_MINUTE = 60 * 1000;

  /** current time in number */
  const currentTS = toUTCDate(new Date());

  /** current time in UTC */
  const currentTime = new Date(currentTS);

  /** @type {Array} */
  const allEvents = dataFilePaths
      .reduce((allEvents, fPath) => allEvents.concat(readJson(fPath)), [])
      .filter((event) => event.publish === true);

  const currentEvents = [];
  const upcomingEvents = [];
  const endedEvents = [];

  /**
   * Sort function (smallest countdown to largest countdown)
   * @param {Object} a - Event A
   * @param {Object} b - Event B
   * @return {number} - Negative if A is before B
   */
  function sortByCountdown(a, b) {
    if (a.countdown > b.countdown) return 1;
    if (a.countdown < b.countdown) return -1;
    return 0;
  }

  /**
   * Convert countdown (microseconds) to XXd, XXh, or XXm
   * @param {number} countdown - countdown (microseconds)
   * @param {object} templates - string templates
   * @return {string}
   */
  function formatCountdown(countdown, templates) {
    const pad = (n) => ((n < 10 ? ' ' : '') + n);

    if (countdown > ONE_DAY) {
      return templates.day.replace(
          '{TIME}',
          pad(Math.ceil(countdown / ONE_DAY)),
      );
    }

    if (countdown > ONE_HOUR) {
      return templates.hour.replace(
          '{TIME}',
          pad(Math.ceil(countdown / ONE_HOUR)),
      );
    }

    return templates.min.replace(
        '{TIME}',
        pad(Math.ceil(countdown / ONE_MINUTE)),
    );
  }

  // Push current, upcoming, and ended events into appropriate event arrays
  allEvents
      .forEach((event) => {
        const startTS = Date.parse(event.date.start);
        const endTS =
          event.date.end?
          Date.parse(event.date.end):
          (event.date.duration * ONE_DAY + startTS);

        if (endTS > currentTS) {
          if (startTS <= currentTS) { // Ongoing events
            const countDown = endTS - currentTS;
            const thisEvent = Object.assign({countdown: countDown}, event);

            if (
              (currentTS - startTS < ONE_DAY) || // Just started
              (countDown < ONE_DAY) // Ending soon
            ) {
              // Use animated fire emoji
              thisEvent.emoji = FireEmoji;
            }

            currentEvents.push(thisEvent);
          } else { // Future events
            const countTo = startTS - currentTS;
            const thisEvent = Object.assign({countdown: countTo}, event);
            if (startTS - currentTS < ONE_DAY) { // Starting soon
              thisEvent.emoji = FireEmoji; // Use animated fire emoji
            }
            upcomingEvents.push(thisEvent);
          }
        } else {
          // Recently ended events
          if ((currentTS - endTS) < 5 * ONE_DAY) {
            const countFrom = currentTS - endTS;
            endedEvents.push(Object.assign({countdown: countFrom}, event),
            );
          }
        }
      });

  upcomingEvents.sort(sortByCountdown);
  currentEvents.sort(sortByCountdown);
  endedEvents.sort(sortByCountdown);

  const fields = [];

  const LineTemplate = l10n.s(locale, 'cmd.aow-events.result.line');

  if (currentEvents.length) {
    const TimeTemplates = {
      day: l10n.s(locale, 'cmd.aow-events.result.count-down-day'),
      hour: l10n.s(locale, 'cmd.aow-events.result.count-down-hr'),
      min: l10n.s(locale, 'cmd.aow-events.result.count-down-min'),
    };

    const Title = l10n.s(locale, 'cmd.aow-events.result.current-title');
    const lines = currentEvents.map((evt) => l10n.r(
        LineTemplate,
        '{COUNT DOWN}', formatCountdown(evt.countdown, TimeTemplates),
        '{EMOJI}', evt.emoji,
        '{TITLE}', evt.title[locale]||evt.title['en-US'],
    ));
    fields.push({name: Title, value: lines.join('\n')});
  }

  if (upcomingEvents.length) {
    const TimeTemplates = {
      day: l10n.s(locale, 'cmd.aow-events.result.count-to-day'),
      hour: l10n.s(locale, 'cmd.aow-events.result.count-to-hr'),
      min: l10n.s(locale, 'cmd.aow-events.result.count-to-min'),
    };

    const Title = l10n.s(locale, 'cmd.aow-events.result.upcoming-title');
    const lines = upcomingEvents.map((evt) => l10n.r(
        LineTemplate,
        '{COUNT DOWN}', formatCountdown(evt.countdown, TimeTemplates),
        '{EMOJI}', evt.emoji,
        '{TITLE}', evt.title[locale]||evt.title['en-US'],
    ));
    fields.push({name: Title, value: lines.join('\n')});
  }

  if (endedEvents.length) {
    const TimeTemplates = {
      day: l10n.s(locale, 'cmd.aow-events.result.count-from-day'),
      hour: l10n.s(locale, 'cmd.aow-events.result.count-from-hr'),
      min: l10n.s(locale, 'cmd.aow-events.result.count-from-min'),
    };

    const Title = l10n.s(locale, 'cmd.aow-events.result.ended-title');
    const lines = endedEvents.slice(0, 3).map((evt) => l10n.r(
        LineTemplate,
        '{COUNT DOWN}', formatCountdown(evt.countdown, TimeTemplates),
        '{EMOJI}', evt.emoji,
        '{TITLE}', evt.title[locale]||evt.title['en-US'],
    ));
    fields.push({name: Title, value: lines.join('\n')});
  }

  // Get pinned announcement
  const news = readJson(joinPath(dataDir, 'news.json'));
  let pinned = undefined;

  if (currentTime.getDay() === 2) {
    pinned = l10n.s(
        locale,
        'cmd.aow-events.result.clan-hunting-start',
    );
  }

  const ONE_SEASON = 14 * ONE_DAY;

  if (!pinned) {
    const ArenaSeason77 = Date.parse('2022-11-6');
    const ArenaSeasonNbr =
      Math.floor((currentTS - ArenaSeason77) / ONE_SEASON) + 77;
    const ArenaDayNbr =
      Math.ceil((currentTS - ArenaSeason77) % ONE_SEASON / ONE_DAY);

    if ( ArenaDayNbr == 14) { // last day of Arena
      pinned = l10n.s(
          locale, 'cmd.aow-events.result.arena-last-day',
          '{SEASON NUMBER}', ArenaSeasonNbr,
      );
    }
  }

  if (!pinned) {
    const CCSeason77 = Date.parse('2022-11-11');
    const CCSeasonNbr =
        Math.floor((currentTS - CCSeason77) / ONE_SEASON) + 77;
    const CCDayNbr =
        Math.floor((currentTS - CCSeason77) % ONE_SEASON / ONE_DAY);

    if ( CCDayNbr == 1) { // first day of Championship Cup
      pinned = l10n.r(
          locale, 'cmd.aow-events.result.championship-cup-start',
          '{SEASON NUMBER}', CCSeasonNbr,
      );
    } else if ( CCDayNbr == 13) { // 1 day before start of next Championship Cup
      // Do nothing
    } else if ( CCDayNbr >= 4) { // Championship Cup has ended
      // Do nothing
    }
  }

  if (!pinned) {
    for (let i=0; i < news.length; i++) {
      const n = news[i];
      if (!n.publish) continue;
      let deadline = Date.parse(n.pin.date);
      if (n.pin.until === 'end-of') deadline += 24 * 60 * 60 * 1000;
      if (deadline > currentTS) {
        pinned = n.content[locale]||n.content['en-US'];
        break;
      }
    }
  }

  if (pinned) {
    interaction.reply({embeds: [
      {color: 0xea4335, description: pinned},
      {color: 0x3271a6, fields: fields},
    ]});
  } else {
    interaction.reply({embeds: [
      {color: 0x3271a6, fields: fields},
    ]});
  }

  return true;
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
