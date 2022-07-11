/*
 * Logger
 **/

import {join as joinPath} from 'path';
import {truncateSync, createWriteStream} from 'fs';

import {clientConfig} from './app-config.js';

/**
 * Log entry
 * @typedef {Object} LogEntry
 * @property {string} summary Log summary
 * @property {string} [details] Log details
 * @property {date} [time] Entry time
 */

/** Logger class */
class Logger {
  /** Constructor */
  constructor() {
    this.fileStreams = new Map();
    this.dataPath = clientConfig['client-data-path'];
    this.openLogBook('client'); // general log
    this.openLogBook('error'); // error log
  }

  /**
   * Open a log book
   * @param {string} logId - Log Id
   * @return {stream}
   */
  openLogBook(logId) {
    const {fileStreams} = this;

    if (!fileStreams.has(logId)) {
      const stream = createWriteStream(
          joinPath(this.dataPath, `${logId}.log`),
          {flags: 'a' /* append */},
      );
      fileStreams.set(logId, stream);
      return stream;
    } else {
      return fileStreams.get(logId);
    }
  }

  /**
   * Get the stream of a log book
   * @param {string} logId - Log book id
   * @return {stream}
   */
  getLogStream(logId) {
    const {fileStreams} = this;
    if (!fileStreams.has(logId)) this.openLogBook(logId);
    return fileStreams.get(logId);
  }

  /**
   * Write a log entry
   * @param {string} logId - Log book id
   * @param {LogEntry|string} entry
   */
  writeLog(logId, entry) {
    if (typeof entry === 'string') {
      const timeStamp =(new Date()).toISOString();
      if (!entry.endsWith('\n')) entry = entry + '\n';
      const formattedLog = timeStamp + '\t' + entry;
      this.getLogStream(logId).write(formattedLog);
    } else {
      const {summary, details, time} = entry;
      const timeStamp =
          ((time instanceof Date)?(time):(new Date())).toISOString();

      const lines = (details)?
          [summary.toString()].concat(details
              .toString()
              .split('\n')
              .map((s) => '  ' + s),
          ):
          [summary.toString()];

      const formattedLog = lines
          .map((s) => timeStamp + '\t' + s)
          .join('\n') + '\n';

      this.getLogStream(logId).write(formattedLog);
    }
  }

  /**
   * Clear a log book
   * @param {string} logId - Log book id
   */
  clearLog(logId) {
    if (this.fileStreams.has(logId)) {
      truncateSync(this.fileStreams.get(logId).path, 0);
    }
  }

  /** Clear all log */
  clearAllLog() {
    this.fileStreams.forEach((stream) => truncateSync(stream.path, 0));
  }

  /**
   * Get file path of a log book
   * @param {string} logId - Log book id
   * @return {string}
   */
  getLogPath(logId) {
    if (this.fileStreams.has(logId)) {
      return this.fileStreams.get(logId).path;
    }
    return '';
  }
}

export const logger = new Logger();
