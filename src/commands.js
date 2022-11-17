/**
 * Command helper
 **/

/**
 * @typedef {import('./typedef.js').CommandHandler} CommandHandler
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').GuildSettings} GuildSettings
 * @typedef {import('./typedef.js').ClientConfig} ClientConfig
 * @typedef {import('./logger.js').LogEntry} LogEntry
 */

import {resolve} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';

import {logger} from './logger.js';
import {findFiles} from './utils.js';

/** File path of this module */
const filePath = resolve(fileURLToPath(import.meta.url), './../');

const commandPath = resolve(filePath, './../commands/');

/**
 * @typedef {import('./typedef.js').CommandHandler} CommandHandler
 * @typedef {import('./typedef.js').DeploymentContext} DeploymentContext
 */

/** Command helper class */
class Commands {
  /** constructor */
  constructor() {
    /**
     * Storage space for file paths of command files
     * @type {Map}
     * @private
     */
    this.dataSources = new Map();

    /**
     * All command handlers
     * @type {Map<string, CommandHandler>}
     * @private
     */
    this.data = new Map();
  }

  /**
   * Initialization - load all commands
   */
  load() {
    this.loadCommandFiles(findFiles(commandPath, ['.js'], 3));
  }

  /**
   * Load command files
   * @param {string[]} filePaths -File paths (.js files)
   */
  loadCommandFiles(filePaths) {
    filePaths.forEach(async (path) => {
      try {
        const href = pathToFileURL(path).href;
        /** @type {CommandHandler} */
        const cmd = await import(href);
        if ((cmd.commandName) && (cmd.execute)) {
          if (this.data.has(cmd.commandName)) {
            logger.writeLog(
                'client.error',
                `Command name collision: ${cmd.commandName}`,
            );
          } else {
            this.data.set(cmd.commandName, cmd);
            this.dataSources.set(cmd.commandName, href);
          }
        }
      } catch (error) {
        logger.writeLog(
            'client.error',
            {
              summary: `Error loading command module from ${path}`,
              details: error.stack,
            },
        );
      }
    });
  }

  /**
   * @param {string} commandName - Command name
   */
  async reloadCommand(commandName) {
    const oldPath = this.dataSources.get(commandName);
    const timeStamp = (new Date()).getTime();

    import(`${oldPath}?update=${timeStamp}`).then((newCmd) => {
      this.data.set(commandName, newCmd);
    });

    return;
  }

  /**
   * @param {string} commandName - Command name
   * @return {CommandHandler}
   */
  getCommand(commandName) {
    return this.data.get(commandName);
  }
}

export const commands = new Commands();
