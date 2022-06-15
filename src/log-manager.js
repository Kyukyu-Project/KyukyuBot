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
      c.guilds.cache
          .map((g) => g.id)
          .concat(['log', 'error'])
          .forEach((id) => this.createFileStream(id));
    });
  }

  /**
   * Create a file stream for a new gild
   * @param {string} logId - Log Id
   * @return {stream}
   */
  createFileStream(logId) {
    const {client, fileStreams} = this;
    if (!fileStreams.has(logId)) {
      const stream = createWriteStream(
          joinPath(client.clientDataPath, `${logId}.log`),
          {flags: 'a' /* append */},
      );
      fileStreams.set(logId, stream);
      return stream;
    } else {
      return fileStreams.get(logId);
    }
  }

  /**
   * Write a log entry
   * @param {string} logId - Log Id
   * @param {string} log - Entry text
   * @param {Date} [time] - Entry time
   */
  writeLog(logId, log, time) {
    const timeStamp =
        ((time instanceof Date)?(time):(new Date())).toISOString();

    const stream =
        this.fileStreams.has(logId)?
        this.fileStreams.get(logId):
        this.createFileStream(logId);

    const formattedLog = log
        .split('\n')
        .map((s) => timeStamp + '\t' + s)
        .join('\n') + '\n';

    stream.write(formattedLog);
  }

  /**
   * Clear a log
   * @param {string} logId - Log Id
   */
  clearLog(logId) {
    if (this.fileStreams.has(logId)) {
      truncateSync(this.fileStreams.get(logId).path, 0);
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
