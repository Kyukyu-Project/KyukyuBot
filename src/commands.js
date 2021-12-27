/*
 * Command helper class
 **/

import {Collection} from 'discord.js';
import url from 'url';

/** Localization class */
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
        const cmd = await import(fileUrl);
        if (this.has(cmd.name)) {
          console.warn(`Command name collision: ${cmd.name}`);
        } else {
          this.set(cmd.name, cmd);
          this.sources.set(cmd.name, fileUrl);
        }
      } catch (error) {
        console.warn(`Error loading command module from ${path}`);
        console.warn(error);
      }
    });
  }
}

export default CommandManager;
