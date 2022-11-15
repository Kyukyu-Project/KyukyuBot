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
    const M = 60 * 1000;

    if (countdown > D) {
      const dd = Math.ceil(countdown / D);
      return (dd >= 10)?`${dd}d`:` ${dd}d`;
    }

    if (countdown > H) {
      const hh = Math.ceil(countdown / H);
      return (hh >= 10)?`${hh}h`:` ${hh}h`;
    }

    const mm = Math.ceil(countdown / M);
    return (mm >= 10)?`${mm}m`:` ${mm}m`;
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
          if ((currentTS - endTS) < 7 * 24 * 60 * 60 * 1000) {
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
    const Template = l10n.s(locale, 'cmd.aow-events.result.current-line');
    const Title = l10n.s(locale, 'cmd.aow-events.result.current-title');
    const lines = currentEvents.map((evt) =>
      l10n.r(
          Template,
          '{COUNT DOWN}', getCountDownString(evt.countdown),
          '{EMOJI}', evt.emoji,
          '{TITLE}', evt.title[locale]||evt.title['en-US'],
      ),
    );
    fields.push({
      name: Title,
      value: lines.join('\n'),
    });
  }

  if (upcomingEvents.length) {
    const Template = l10n.s(locale, 'cmd.aow-events.result.upcoming-line');
    const Title = l10n.s(locale, 'cmd.aow-events.result.upcoming-title');
    const lines = upcomingEvents.map((evt) =>
      l10n.r(
          Template,
          '{COUNT DOWN}', getCountDownString(evt.countdown),
          '{EMOJI}', evt.emoji,
          '{TITLE}', evt.title[locale]||evt.title['en-US'],
      ),
    );
    fields.push({
      name: Title,
      value: lines.join('\n'),
    });
  }

  if (endedEvents.length) {
    const Template = l10n.s(locale, 'cmd.aow-events.result.ended-line');
    const Title = l10n.s(locale, 'cmd.aow-events.result.ended-title');
    const lines = endedEvents.slice(0, 3).map((evt) =>
      l10n.r(
          Template,
          '{COUNT DOWN}', getCountDownString(evt.countdown),
          '{EMOJI}', evt.emoji,
          '{TITLE}', evt.title[locale]||evt.title['en-US'],
      ),
    );
    fields.push({
      name: Title,
      value: lines.join('\n'),
    });
  }

  const response = {embeds: [{fields: fields}]};

  // Get pinned announcement
  const news = readJson(joinPath(dataDir, 'news.json'));
  let pinned = undefined;
  for (let i=0; i < news.length; i++) {
    const n = news[i];
    if (!n.publish) continue;
    let deadline = Date.parse(n.pin.date);
    if (n.pin.until === 'end-of') deadline += 24 * 60 * 60 * 1000;
    if (deadline > currentTS) {
      pinned = n;
      break;
    }
  }

  if (pinned) {
    response.content = pinned.content[locale]||pinned.content['en-US'];
  }

  interaction.reply(response);

  return true;
}
