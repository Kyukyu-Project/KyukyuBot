/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'fun.seckin';
export const name = 'seckin';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 3;
export const guilds = ['658594298983350293'];

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  const cHint = 'send a greeting message in multiple languages';
  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint);
}
/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {interaction} = context;

  const msg = [
    'Good Morning 🇺🇸',
    'Günaydın 🇹🇷',
    'Guten Morgen 🇩🇪',
    'Buongiorno 🇮🇹',
    'Buenos Dias 🇪🇸',
    'Bonjour 🇫🇷',
    'Dzień Dobry 🇵🇱',
    'Goede Morgen 🇳🇱',
    'Huomenta 🇫🇮',
    'Доброе утро 🇷🇺',
    'صباح الخير  🇵🇸',
    'dobré ráno 🇨🇿',
    'Καλημέρα  🇬🇷',
    'God morgen! 🇳🇴',
    'Magandang Umaga 🇵🇭',
    'おはよう ございます 🇯🇵',
    '早上好 🇹🇼',
    'Bom dia 🇵🇹',
    'Доброе утро 🇷🇺',
    'Dobro jutro 🇭🇷',
    'อรุณสวัสดิ์ 🇹🇭',
    'शुभ प्रभात /శుభోదయం 🇮🇳',
    'G’day 🇦🇺',
    'Góðan daginn 🇮🇸',
    'Jó reggelt 🇭🇺',
    'Mōrena 🇳🇿',
  ].join('  ');

  interaction.reply({content: msg});

  return true;
}
