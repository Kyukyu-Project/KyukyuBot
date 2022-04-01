/* eslint-disable max-len */
/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

const AOW_SERVER_ID = '658594298983350293';
const OWNER_SERVER_ID = '762562773333835787';

export const canonName = 'fun.joke-mode';
export const name = 'joke-mode';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.MODERATOR;
export const cooldown = 3;
export const guilds = [AOW_SERVER_ID];

let joking = false;
let eventHandlerAttached = false;

/** @type {RegExp[]} */
const filters = [
  /why (did|do) (Poseidon and Selene|Poseidon & Selene|Selene and Poseidon|Selene & Poseidon) (break|broke) up/i,
  /(what|which) hero is (?:very |really |real )?bad at basketball/i,
  /why (?:do|does) mages? skip (?:class|school)/i,
  /how (?:do|can) you summon (?:a |an )?azrael/i,
  /who is the most self-centered hero?/i,
];

const answers = [
  'Because their relationship is Poselene (porcelain)',
  'Aly, because she keeps dropping the ball',
  'Because they don\'t want to become scholars',
  'with *nun*-stop praying',
  'Chi**one**',
];

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const cHint = 'start joke mode';
  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint);
}

/**
   * Handle message
   * @param {Discord.Message} msg
   */
async function onMessageCreate(msg) {
  if (
    (msg.guild) &&
    ((msg.guild.id === AOW_SERVER_ID) || (msg.guild.id === OWNER_SERVER_ID))
  ) {
    const {content} = msg;
    const idx = filters.findIndex((regex) => regex.test(content));
    if (idx !== -1) {
      msg.channel.send(answers[idx]);
    }
  }
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  if (!joking) {
    joking = true;
    setTimeout(()=> joking = false, 3 * 60 * 1000);
  }
  if (!eventHandlerAttached) {
    context.client.on('messageCreate', (msg) => onMessageCreate(msg));
    eventHandlerAttached = true;
  }
  context.interaction.reply({content: 'joke mode activated', ephemeral: true});
  return true;
}
