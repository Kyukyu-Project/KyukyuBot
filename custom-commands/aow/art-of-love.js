/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {ContextMenuCommandBuilder} from '@discordjs/builders';

export const canonName = 'fun.art-of-love';
export const name = 'art-of-love';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 3;
export const guilds = ['658594298983350293'];

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  return new ContextMenuCommandBuilder().setName(name).setType(3);
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {channel, interaction} = context;
  await interaction.deferReply({ephemeral: true});
  const message = channel.messages.cache.get(interaction.targetId);
  await message.react('❤️');
  await message.react('🧡');
  await message.react('💛');
  await message.react('💚');
  await message.react('💙');
  await message.react('💜');
  interaction.editReply('❤️');
  return true;
}
