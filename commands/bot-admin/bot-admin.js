/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

export const commandName = 'bot-admin';
export const cooldown  = 0;

import * as helperRoleCommand from './bot-admin.helper-roles.js';
import * as botChannelCommand from './bot-admin.bot-channel.js';
import * as logCommand from './bot-admin.log.js';

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction} = context;

  const subCommandGroup = interaction.options.getSubcommandGroup();
  switch (subCommandGroup) {
    case 'bot-channel': return botChannelCommand.execute(context);
    case 'helper-roles': return helperRoleCommand.execute(context);
    case 'log': return logCommand.execute(context);
  }
  return false;
}

/**
 * Run autocomplete
 * @param {CommandContext} context - Interaction context
 */
export function autocomplete(context) {
  const {interaction} = context;

  const subCommandGroup = interaction.options.getSubcommandGroup();
  switch (subCommandGroup) {
    // case 'bot-channel': return botChannelCommand.autocomplete(context);
    case 'helper-roles': helperRoleCommand.autocomplete(context);
  }
}
