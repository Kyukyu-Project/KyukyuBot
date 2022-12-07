/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

export const commandName = 'super-admin';
export const cooldown  = 0;

import * as logCommand from './super-admin.log.js';
import * as runCommand from './super-admin.run.js';
import * as shutDownCommand from './super-admin.shut-down.js';

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  switch (context.interaction.options.getSubcommandGroup()) {
    case 'log': return logCommand.execute(context);
    case 'run': return runCommand.execute(context);
    default:
      switch (context.interaction.options.getSubcommand()) {
        case 'shut-down': return shutDownCommand.execute(context);
      }
  }
  return false;
}

/**
 * Run autocomplete
 * @param {CommandContext} context - Interaction context
 */
export function autocomplete(context) {
  switch (context.interaction.options.getSubcommandGroup()) {
    case 'log': logCommand.autocomplete(context);
  }
}
