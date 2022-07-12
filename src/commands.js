/**
 * Command helper
 **/

import {resolve} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';

import {Collection} from 'discord.js';

import {logger} from './logger.js';
import {getFilesFromDir} from '../utils/utils.js';

/** File path of this module */
const filePath = resolve(fileURLToPath(import.meta.url), './../');

const commandPath = resolve(filePath, './../commands/');
const customCommandPath = resolve(filePath, './../custom-commands/');

/**
 * @typedef {import('./typedef.js').Command} Command
 * @typedef {import('./typedef.js').DeploymentContext} DeploymentContext
 */

/** Command helper class */
class Commands extends Collection {
  /** Constructor */
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
   * Initialization - load all commands
   */
  load() {
    this.loadCommandFiles(getFilesFromDir(commandPath, ['.js'], 3));
    this.loadCommandFiles(getFilesFromDir(customCommandPath, ['.js'], 3));
  }

  /**
   * Load command files
   * @param {string[]} filePaths -File paths (.js files)
   */
  loadCommandFiles(filePaths) {
    filePaths.forEach(async (path) => {
      try {
        const href = pathToFileURL(path).href;
        /** @type {Command} */
        const cmd = await import(href);
        if (this.has(cmd.canonName)) {
          logger.writeLog(
              'error',
              {summary: `Command name collision: ${cmd.canonName}`},
          );
        } else {
          this.set(cmd.canonName, cmd);
          this.sources.set(cmd.canonName, href);
        }
      } catch (error) {
        logger.writeLog(
            'error',
            {
              summary: `Error loading command module from ${path}`,
              details: error.stack,
            },
        );
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

export const commands = new Commands();
