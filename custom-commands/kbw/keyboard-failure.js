/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import {wait} from '../../utils/utils.js';

export const canonName = 'fun.keyboard-failure';
export const name = 'keyboard-failure';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 3;
export const guilds = ['781230000069804053'];

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  return new SlashCommandBuilder()
      .setName(name)
      .setDescription('Keyboard failure!');
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {channel, interaction} = context;
  await interaction.deferReply({ephemeral: true});
  channel.sendTyping();
  wait(20);
  channel.send('@Q#x$a;%.&*@!$*k');
  interaction.editReply('Done!');
  return true;
}
