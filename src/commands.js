/**
 * Command helper
 **/

/**
 * @typedef {import('./typedef.js').CommandContainer} CommandContainer
 * @typedef {import('./logger.js').LogEntry} LogEntry
 */

import {resolve} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';

import {logger} from './logger.js';
import {findFiles} from './utils.js';

/** File path of this module */
const filePath = resolve(fileURLToPath(import.meta.url), './../');

const cmdFilePaths = resolve(filePath, './../commands/');


/** Command helper class */
class Commands {
  /** constructor */
  constructor() {
    /**
     * Storage space for file paths of command files
     * @type {Map}
     * @private
     */
    this.cmdDataSources = new Map();

    /**
     * All command handlers
     * @type {Map<string, CommandHandler>}
     * @private
     */
    this.cmdData = new Map();

    /**
     * All control panel handlers
     */
    this.controlPanels = [];
  }

  /**
   * Initialization - load all commands
   */
  load() {
    this.loadCommandFiles(findFiles(cmdFilePaths, ['.js'], 3));
  }

  /**
   * Load command files
   * @param {string[]} filePaths -File paths (.js files)
   */
  loadCommandFiles(filePaths) {
    const cpNames = [];
    filePaths.forEach(async (path) => {
      try {
        const href = pathToFileURL(path).href;

        /** @type {CommandContainer} */
        const imported = await import(href);

        if (imported.command) {
          const cmd = imported.command;
          if (this.cmdData.has(cmd.name)) {
            logger.writeLog(
                'client.error',
                `Command name collision: ${cmd.name}`,
            );
          } else {
            this.cmdData.set(cmd.name, cmd);
            this.cmdDataSources.set(cmd.name, href);
          }
        }

        if (imported.controlPanel) {
          const cp = imported.controlPanel;
          if (cpNames.includes(cp.name)) {
            logger.writeLog(
                'client.error',
                `Control panel name collision: ${cp.name}`,
            );
          } else {
            cpNames.push(cp.name);
            this.controlPanels.push(cp);
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
    const oldPath = this.cmdDataSources.get(commandName);
    const timeStamp = (new Date()).getTime();

    import(`${oldPath}?update=${timeStamp}`).then((newCmd) => {
      this.cmdData.set(commandName, newCmd);
    });

    return;
  }

  /**
   * @param {string} commandName - Command name
   * @return {CommandHandler}
   */
  getCommand(commandName) {
    return this.cmdData.get(commandName);
  }
}

/** Command helper */
export const commands = new Commands();
