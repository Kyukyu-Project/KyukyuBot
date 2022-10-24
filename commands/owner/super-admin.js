/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

export const commandName = 'super-admin';
export const cooldown  = 0;

import * as logCommand from './super-admin.log.js';

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction} = context;

  const subCommandGroup = interaction.options.getSubcommandGroup();
  switch (subCommandGroup) {
    case 'log': return logCommand.execute(context);
  }
  return false;
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export function autocomplete(context) {
  const {interaction} = context;

  const subCommandGroup = interaction.options.getSubcommandGroup();
  switch (subCommandGroup) {
    case 'log': return logCommand.autocomplete(context);
  }
  return false;
}
