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
        const href = url.pathToFileURL(path).href;
        /** @type {Command} */
        const cmd = await import(href);
        if (this.has(cmd.canonName)) {
          console.warn(`Command name collision: ${cmd.canonName}`);
        } else {
          this.set(cmd.canonName, cmd);
          this.sources.set(cmd.canonName, href);
        }
      } catch (error) {
        console.warn(`Error loading command module from ${path}`);
        console.warn(error);
      }
    });
  }

  /**
   * @param {string} cmdCanonName - canonical command name
   */
  async reloadCommand(cmdCanonName) {
    const oldPath = this.sources.get(cmdCanonName);
    const timeStamp = (new Date()).getTime();

    return import(`${oldPath}?update=${timeStamp}`)
        .then((newCmd) => {
          this.set(cmdCanonName, newCmd);
        });
  }
}

export default CommandManager;
