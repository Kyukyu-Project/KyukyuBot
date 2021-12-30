/*
 * Command helper class
 **/

import {Collection} from 'discord.js';
import url from 'url';

/**
 * @typedef {import('./typedef.js').Command} Command
 */

/** Command helper class */
class CommandManager extends Collection {
  /**
   * Constructor
   */
  constructor() {
    super();
    /**
     * Storage space for file paths of command files
     * @type {Collection}
     * @private
     */
    this.sources = new Collection();
  }

  /**
   * Load command files
   * @param {string[]} filePaths -File paths (.js files)
   */
  loadCommandFiles(filePaths) {
    filePaths.forEach(async (path) => {
      try {
        const fileUrl = url.pathToFileURL(path);
        /** @type {Command} */
        const cmd = await import(fileUrl);
        if (this.has(cmd.canonName)) {
          console.warn(`Command name collision: ${cmd.canonName}`);
        } else {
          this.set(cmd.canonName, cmd);
          this.sources.set(cmd.canonName, fileUrl);
        }
      } catch (error) {
        console.warn(`Error loading command module from ${path}`);
        console.warn(error);
      }
    });
  }
}

export default CommandManager;
