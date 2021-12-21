/*
 * Command helper class
 **/

import {Collection} from 'discord.js';

/** Localization class */
class CooldownManager extends Collection {
  /**
   * Constructor
   */
  constructor() {
    super();
  }

  /**
   * Check if the user is in cooldown
   * @param {string} guildId - Guild Id
   * @param {string} userId -User Id
   * @param {string} cmdName - Command name
   * @return {number} Timestamp of cooldown expiration
   */
  getCooldown(guildId, userId, cmdName) {
    return this.get(guildId)?.get(userId)?.get(cmdName) || 0;
  }

  /**
   * Set cooldown
   * @param {string} guildId - Guild Id
   * @param {string} userId -User Id
   * @param {string} cmdName - Command name
   * @param {number} seconds - Cool-down time in seconds
   */
  setCooldown(guildId, userId, cmdName, seconds) {
    let userData;
    let guildData = this.get(guildId);

    if (guildData) {
      userData =  guildData.get(userId);
      if (userData) {
        //
      } else { // create userData
        userData = new Collection();
        guildData.set(userId, userData);
      }
    } else { // create guildData
      guildData = new Collection();
      this.set(guildId, guildData);
      userData = new Collection();
      guildData.set(userId, userData);
    }

    const expiration = Date.now() + seconds * 1000;
    userData.set(cmdName, expiration);
    setTimeout(() => userData.delete(cmdName), seconds * 1000);
  }
}

export default CooldownManager;
