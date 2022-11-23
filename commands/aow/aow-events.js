/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

// import {l10n} from '../../src/l10n.js';
import {l10n} from '../../src/l10n.js';
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
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction, locale} = context;

  /** current time in number */
  const currentTS = toUTCDate(new Date());

  /** current time in UTC */
  const currentTime = new Date(currentTS);

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
   * Convert countdown (microseconds) to XXd, XXh, or XXm
   * @param {number} countdown - countdown (microseconds)
   * @return {string}
   */
  function formatCountdown(countdown) {
    const pad = (n) => ((n < 10 ? ' ' : '') + n);
    const D = 24 * 60 * 60 * 1000;
    const H = 60 * 60 * 1000;
    const M = 60 * 1000;
    if (countdown > D) return pad(Math.ceil(countdown / D)) + 'd';
    if (countdown > H) return pad(Math.ceil(countdown / H)) + 'h';
    return pad(Math.ceil(countdown / M)) + 'm';
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
            currentEvents.push(Object.assign({countdown: countdown}, event),
            );
          } else { // Future events
            const countdown = startTS - currentTS;
            upcomingEvents.push(Object.assign({countdown: countdown}, event),
            );
          }
        } else {
          // Recently ended events
          if ((currentTS - endTS) < 7 * 24 * 60 * 60 * 1000) {
            const countdown = currentTS - endTS;
            endedEvents.push(Object.assign({countdown: countdown}, event),
            );
          }
        }
      });

  upcomingEvents.sort(sort);
  currentEvents.sort(sort);
  endedEvents.sort(sort);

  const fields = [];

  if (currentEvents.length) {
    const Template = l10n.s(locale, 'cmd.aow-events.result.current-line');
    const Title = l10n.s(locale, 'cmd.aow-events.result.current-title');
    const lines = currentEvents.map((evt) =>
      l10n.r(
          Template,
          '{COUNT DOWN}', formatCountdown(evt.countdown),
          '{EMOJI}', evt.emoji,
          '{TITLE}', evt.title[locale]||evt.title['en-US'],
      ),
    );
    fields.push({name: Title, value: lines.join('\n')});
  }

  if (upcomingEvents.length) {
    const Template = l10n.s(locale, 'cmd.aow-events.result.upcoming-line');
    const Title = l10n.s(locale, 'cmd.aow-events.result.upcoming-title');
    const lines = upcomingEvents.map((evt) =>
      l10n.r(
          Template,
          '{COUNT DOWN}', formatCountdown(evt.countdown),
          '{EMOJI}', evt.emoji,
          '{TITLE}', evt.title[locale]||evt.title['en-US'],
      ),
    );
    fields.push({name: Title, value: lines.join('\n')});
  }

  if (endedEvents.length) {
    const Template = l10n.s(locale, 'cmd.aow-events.result.ended-line');
    const Title = l10n.s(locale, 'cmd.aow-events.result.ended-title');
    const lines = endedEvents.slice(0, 3).map((evt) =>
      l10n.r(
          Template,
          '{COUNT DOWN}', formatCountdown(evt.countdown),
          '{EMOJI}', evt.emoji,
          '{TITLE}', evt.title[locale]||evt.title['en-US'],
      ),
    );
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

  const Day = 24 * 60 * 60 * 1000;
  const Season = 14 * Day;

  const ArenaSeason77 = Date.parse('2022-11-6');
  const ArenaSeasonNbr = Math.floor((currentTS - ArenaSeason77) / Season) + 77;
  const ArenaDayNbr = Math.ceil( (currentTS - ArenaSeason77) % Season / Day );

  const CCSeason77 = Date.parse('2022-11-11');
  const CCSeasonNbr = Math.floor((currentTS - CCSeason77) / Season) + 77;
  const CCDayNbr = Math.floor( (currentTS - CCSeason77) % Season / Day );

  if (!pinned) {
    if ( ArenaDayNbr == 14) { // last day of Arena
      pinned = l10n.s(
          locale, 'cmd.aow-events.result.arena-last-day',
          '{SEASON NUMBER}', ArenaSeasonNbr,
      );
    }
  }

  if (!pinned) {
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
