/*
 * Server config helper
 **/

import {join as joinPath} from 'path';

import {clientConfig} from './app-config.js';

import {saveCollectionToFile, createCollectionFromFile}
  from '../utils/utils.js';

/**
 * @typedef {import('discord.js')} Discord
 * @typedef {import('./typedef.js').GuildSettings} GuildSettings
 * @typedef {import('./typedef.js').ClientConfig} ClientConfig
 */

/** Server config helper class */
class Servers {
  /** Constructor */
  constructor() {
    const dataPath = clientConfig['client-data-path'];

    /** @type {string} - File path for server settings */
    this.filePath = joinPath(dataPath, 'servers.json');

    /** @type {Discord.Collection} - Server settings */
    this.data = createCollectionFromFile(this.filePath);
  }

  /**
   * Get a copy of the server settings
   * @param {Discord.Guild} server - Guild (Discord server)
   * @return {GuildSettings}
   */
  getSettings(server) {
    const settings = this.data.get(server.id);
    if (settings) {
      return Object.assign({}, settings);
    } else {
      return {
        'name': server.name,
        'lang': clientConfig['default-lang'],
        'command-prefix': clientConfig['default-prefix'],
        'bot-channel': '',
      };
    }
  }

  /**
   * Update server settings
   * @param {Discord.Guild} server - Guild (Discord server)
   * @param {string} key - Setting key
   * @param {string|string[]} value - New value
   */
  updateSettings(server, key, value) {
    const settings = this.getSettings(server);
    settings[key] = value;
    this.data.set(server.id, settings);
    this.saveSettings();
  }

  /**
   * Save server settings
   */
  saveSettings() {
    saveCollectionToFile(this.data, this.filePath);
  }
}

export const servers = new Servers();
