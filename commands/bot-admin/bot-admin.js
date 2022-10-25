/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

export const commandName = 'bot-admin';
export const cooldown  = 0;

import * as helperRoleCommand from './bot-admin.helper-roles.js';
import * as botChannelCommand from './bot-admin.bot-channel.js';
import * as logCommand from './bot-admin.log.js';

/**
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
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export function autocomplete(context) {
  const {interaction} = context;

  const subCommandGroup = interaction.options.getSubcommandGroup();
  switch (subCommandGroup) {
    // case 'bot-channel': return botChannelCommand.autocomplete(context);
    case 'helper-roles': return helperRoleCommand.autocomplete(context);
  }
  return false;
}
