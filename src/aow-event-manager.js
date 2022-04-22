import {join as joinPath} from 'path';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import heroBase from '../data/heroes.js';

/**
 * @typedef {import('./client.js').default} Client
 */

/** Command helper class */
class EventManager {
  /**
   * Constructor
   * @param {Client} client -Bot client
   */
  constructor(client) {
    /** @type {Client} */ this.client = client;

    this.eventFilePath =
      joinPath(client.clientDataPath, 'aow-hero-events.json');

    if (existsSync(this.eventFilePath)) {
      this.events = JSON.parse(readFileSync(this.eventFilePath, 'utf8')).events;
      this.statsRefresh();
    } else {
      console.warn('Unable to load past AoW hero events');
      this.events = [];
      this.pastEventLegendaryHeroes = [];
      this.pastEventEpicHeroes = [];
      this.recentEventStats13 = [];
    }
  }

  /** Refresh stats */
  statsRefresh() {
    const allPastEventHeroes = [...new Set(
        this.events.reduce((all, event) => all.concat(event.heroes), [])),
    ];

    /** a list of all heroes in past events */
    this.pastEventHeroes = allPastEventHeroes.map((hero) => {
      return {
        name: hero,
        rarity: heroBase.find((data) => data.name === hero).rarity,
      };
    });

    /** a list of all legendary heroes (sans Athena) in past events */
    this.pastEventLegendaryHeroes = this.pastEventHeroes
        .filter((h) => (h.name !== 'athena') && (h.rarity === 'legendary'))
        .map((h) => h.name);

    /** a list of all epic heroes in past events */
    this.pastEventEpicHeroes = this.pastEventHeroes
        .filter((h) => (h.rarity === 'epic'))
        .map((h) => h.name);

    this.recentEventStats13 = this.getRecentEventStats(13);
    this.recentEventList6 = this.getRecentEventList('*', 6);
    this.recentEventList12 = this.getRecentEventList('*', 12);
  }

  /**
   * Get stats of recent events
   * @param {number} count - how many events to run stats on
   * @return {object}
   */
  getRecentEventStats(count) {
    const recentHeroes = this.events
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
  getRecentEventList(hero, count) {
    let events = this.events;
    if (hero === 'athena') return [];
    if (hero !== '*') {
      events = events.filter((evt) => evt.heroes.includes(hero));
    }

    return events.slice(0, count-1);
  }

  /**
   * Add a new event
   * @param {string[]} heroesToAdd - heroes to add
   * @return {object}
   */
  addEvent(heroesToAdd) {
    heroesToAdd = heroesToAdd.filter(
        (hero) => heroBase.findIndex((data) => data.name === hero) !== -1);

    if (heroesToAdd.length == 0) return {date: '', heroes: []};

    let eventDate;
    if (this.events.length == 0) {
      eventDate = new Date(Date.UTC(2020, 4, 19));
    } else {
      eventDate = new Date(this.events[0].date);
      eventDate.setUTCDate(eventDate.getUTCDate() + 7);
    }

    const newEvent = {date: Number(eventDate), heroes: heroesToAdd};

    this.events.unshift(newEvent);
    writeFileSync(this.eventFilePath, JSON.stringify({events: this.events}));
    this.statsRefresh();

    return newEvent;
  }

  /**
   * Delete an event
   * @return {object}
   */
  removeEvent() {
    if (this.events.length == 0) return {date: 0, heroes: []};

    const lastEvent = this.events.shift();

    writeFileSync(this.eventFilePath, JSON.stringify({events: this.events}));
    this.statsRefresh();

    return lastEvent;
  }
}

export default EventManager;
