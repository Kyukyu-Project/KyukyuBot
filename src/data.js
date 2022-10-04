import {
  getModuleDirectory,
  resolvePath,
  readJson,
  saveJson,
} from './utils.js';

/**
 * @typedef {Object} Event
 * @property {number} ts - start date timestamp
 * @property {string} date - start date in human readable form
 * @property {"cm"|"wof"} type - event type
 * @property {string[]} heroes - list of heroes
 */

const thisFilePath = getModuleDirectory(import.meta);
const dataDir = resolvePath(thisFilePath, '../data/');
const eventFilePath = resolvePath(dataDir, './hero-events.json');
const heroBase = readJson(resolvePath(dataDir, './heroes.json'));

/** @type {Event[]} */
const heroEventBase = readJson(eventFilePath);

export const data = {
  'heroes': heroBase,
  'hero-events': heroEventBase,

  /**
   * Add a new card master event
   * @param {string[]} heroesToAdd - Heroes to add
   * @return {{Date: string, heroes: string[]}}
   */
  addCmEvent(heroesToAdd) {
    heroesToAdd = [...new Set(heroesToAdd)]
        .filter((h) => heroBase.findIndex((data) => data.name === h) !== -1);

    if (heroesToAdd.length == 0) return {Date: '', heroes: []};

    let eventDate;
    if (heroEventBase.length == 0) {
      eventDate = new Date(Date.UTC(2020, 4, 19));
    } else {
      eventDate = new Date(heroEventBase[0].ts);
      eventDate.setUTCDate(eventDate.getUTCDate() + 7);
    }

    /** @type Event */
    const newEvent = {
      ts: Number(eventDate),
      date: eventDate.toISOString().split('T')[0],
      type: 'cm',
      heroes: heroesToAdd,
    };

    heroEventBase.unshift(newEvent);
    saveJson(heroEventBase, eventFilePath);
    return newEvent;
  },

  /**
   * Add a new card master event
   * @param {string[]} heroesToAdd - Heroes to add
   * @return {{Date: string, heroes: string[]}}
   */
  addWofEvent(heroesToAdd) {
    heroesToAdd = [...new Set(heroesToAdd)]
        .filter((h) => heroBase.findIndex((data) => data.name === h) !== -1);

    if (heroesToAdd.length == 0) return {Date: '', heroes: []};

    let eventDate;
    if (heroEventBase.length == 0) {
      eventDate = new Date(Date.UTC(2020, 4, 19));
    } else {
      eventDate = new Date(heroEventBase[0].ts);
      eventDate.setUTCDate(eventDate.getUTCDate() + 7);
    }

    /** @type Event */
    const newEvent = {
      ts: Number(eventDate),
      date: eventDate.toISOString().split('T')[0],
      type: 'wof',
      heroes: heroesToAdd,
    };

    heroEventBase.unshift(newEvent);
    saveJson(heroEventBase, eventFilePath);
    return newEvent;
  },

  /**
   * Remove the last entry of events database
   * @return {{Date: string, heroes: string[]}}
   */
  removeEvent() {
    if (heroEventBase.length == 0) return {ts: 0, heroes: []};
    const lastEvent = heroEventBase.shift();
    saveJson(heroEventBase, eventFilePath);
    return lastEvent;
  },
};
