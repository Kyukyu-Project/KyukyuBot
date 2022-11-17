/*
 * Miscellaneous utility functions
 **/

/**
 * @typedef {import('discord.js').Interaction} Interaction
 * @typedef {import('discord.js').CommandInteractionOption} CommandInteractionOption
 */

export {
  findFiles,
  isDirectory,
  isFile,
  getFileSize,
  joinPath,
  resolvePath,
  makeDirectory,
  clearDirectory,
  readDirectory,
  fileExists,
  getFileExtension,
  getModuleDirectory,
} from './utils/fsUtils.js';

export {
  readTJson,
  buildResource,
  readJson,
  saveJson,
  objectToMap,
} from './utils/objectUtils.js';

import {
  PermissionsBitField,
  ApplicationCommandOptionType,
} from 'discord.js';


/**
 * Asynchronously pause for a few seconds
 * @param {number} seconds - Number of seconds
 * @return {Promise}
 */
export async function waitAsync(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Synchronously pause (hard stop) for a few seconds
 * @param {number} seconds - Number of seconds
 * @return {Promise}
 */
export async function waitSync(seconds) {
  await pause(seconds);
}

/**
 * Resolve BigInt permission bit field to string
 * @param {BigInt} permission - permission to be resolved
 * @return {string}
 */
export function resolvePermissionsBitField(permission) {
  return PermissionsBitField.resolve(permission).toString();
}

/**
 * Get full slash command (for logging purpose)
 * @param {Interaction} interaction - permission to be resolved
 * @return {string}
 */
export function getFullSlashCommand(interaction) {
  /** Array of reduced command fragments */
  const fragments = [`/${interaction.commandName}`];

  /**
   * Serialize command options
   * @param {CommandInteractionOption[]} options - Command options
   */
  function __serialize(options) {
    options.forEach((currOption) => {
      switch (currOption.type) {
        case ApplicationCommandOptionType.SubcommandGroup:
        case ApplicationCommandOptionType.Subcommand:
          fragments.push(currOption.name);
          __serialize(currOption.options);
          break;
        default:
          fragments.push(`${currOption.name}:"${currOption.value}"`);
      }
    });
  }
  __serialize(interaction.options.data);
  return fragments.join(' ');
}

/** Null arrow function */
export const noop = ()=> {};
