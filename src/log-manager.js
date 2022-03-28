/*
 * Command helper class
 **/

import {join as joinPath} from 'path';
import {
  truncateSync,
  createWriteStream,
} from 'fs';

/**
 * @typedef {import('./typedef.js').Command} Command
 * @typedef {import('./client.js').default} Client
 */

/** Command helper class */
class LogManager {
  /**
   * Constructor
   * @param {Client} client -Bot client
   */
  constructor(client) {
    /** @type {Client} */ this.client = client;
    /** @type {Set} */ this.fileStreams = new Map();
    client.on('ready', (c) => {
      c.guilds.cache.forEach((g) => this.createFileStream(g.id));
    });

    client.on('guildCreate', (g) => this.createFileStream(g.id));
  }

  /**
   * Create a file stream for a new gild
   * @param {string} guildId - Guild Id
   * @param {string} log - Log text
   */
  createFileStream(guildId) {
    const {client, fileStreams} = this;
    if (!fileStreams.has(guildId)) {
      fileStreams.set(
          guildId,
          createWriteStream(
              joinPath(client.clientDataPath, `${guildId}.log`),
              {flags: 'a' /* append */},
          ),
      );
    }
  }

  /**
   * Write a log entry
   * @param {string} guildId - Guild Id
   * @param {string} log - Log text
   */
  writeLog(guildId, log) {
    if (this.fileStreams.has(guildId)) {
      this.fileStreams.get(guildId).write(log);
    }
  }

  /**
   * Clear a log
   * @param {string} guildId - Guild Id
   */
  clearLog(guildId) {
    if (this.fileStreams.has(guildId)) {
      truncateSync(this.fileStreams.get(guildId).path, 0);
    }
  }

  /**
   * Clear all log
   */
  clearAllLog() {
    this.fileStreams.forEach((stream) => truncateSync(stream.path, 0));
  }

  /**
   * Write a log entry
   * @param {string} guildId - Guild Id
   * @return {string}
   */
  getLogPath(guildId) {
    if (this.fileStreams.has(guildId)) {
      return this.fileStreams.get(guildId).path;
    }
    return '';
  }
}

export default LogManager;
