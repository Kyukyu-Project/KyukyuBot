import {readFileSync, writeFileSync} from 'fs';
import {formatDate} from '../../../utils/utils.js';
import heroBase from '../../../data/heroes.js';

/**
 * @typedef {Object} Event
 * @property {number} ts - start date timestamp
 * @property {string} date - start date in human readable form
 * @property {"cm"|"wof"} type - event type
 * @property {string[]} heroes - list of heroes
 */

const eventFilePath = new URL('./hero-events.json', import.meta.url);

/** @type {Event[]} */
export const events = JSON.parse(readFileSync(eventFilePath, 'utf8'));

/**
 * @type {{name:string, rarity: string}[]}
 * a list of all heroes in past events
 * */
let pastEventHeroes = [];

/** @type {string[]} - a list of all legendary heroes in past */
export let pastEventLegendaryHeroes = [];

/** @type {string[]} - a list of all epic heroes in past */
export let pastEventEpicHeroes = [];

export let recentEventStats13;

export let recentEventList6;
export let recentEventList12;

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
export function addEvent(heroesToAdd) {
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
export function removeEvent() {
  if (events.length == 0) return {date: 0, heroes: []};

  const lastEvent = events.shift();
  writeFileSync(eventFilePath, JSON.stringify(events, null, 2));
  statsRefresh();

  return lastEvent;
}
