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
  /(who is the most self-centered hero|what hero is the most self-centered)/i,
  /who (?:won|win) (?:the )?(?:aow|art of war|aowl) (?:beauty|beauty pageant) contest/i,
  /(?:how would|how'd) you describe (?:the )?spider[ -]queen/i,
  /why (?:did|do) (?:the )?spider[ -]queen quit/i,
  /(?:hear|heard|know|knew) what happened in.*concert/i,
  /ivan (?:broke|break|storm|stormed|bursted|burst) into .*meeting (?:room )?and (demanded|asked for) (?:a )?buff/i,
  /why (?:is|was) zeus fired .*as (?:a )lifeguard/i,
  /why (?:did|do) (?:the )?(peltasts|peltast) lose the marathon/i,
  /why is (?:Rhino Knight|RK).*credit score so low/i,
  /why (?:was|is) Ivan banned from (?:the )?zoo/i,
  /why is (?:the )(beast master|BM) (bad|terrible) at math/i,
  /(think cactuses (?:will|would) be buffed|think about cactuses buff)/i,
  /why isn't hohenheim (?:a )?legendary/i,
  /you can only live once/i,
  /who (?:is|was) banned (?:from Discord|.*by Ogre Warrior)/i,
  /why is kriss (bad at farming|a bad farmer)/i,
  /(?:what|which) hero is (?:both )?(sacred and wild|wild and sacred)/i,
  /is planck a greek god/i,
];

const answers = [
  'Because their relationship is *Poselene* (porcelain)',
  'Aly, because she keeps dropping the ball',
  'Because they don\'t want to become scholars',
  'with *nun*-stop praying',
  'Chi**one**',
  'Selene. She was stunning.',
  'Lots of *lags*',
  'Not even she can handle the *lags*.',
  'Yeah, Goblikazes got booed off the stage \'cuz they totally bombed.',
  'Yes. But the room was in full *silence*.',
  'Electricity and water don\'t mix.',
  'They kept running backwards',
  'He keeps charging.',
  'He kept chasing the squirrels',
  'He got the Axe but not the Whys',
  'That question is too thorny to answer.',
  'Because he can\'t create gems with alchemy',
  '"say what?", said the undead soldier',
  'Voodoo Dolls because they kept cursing',
  '\'cuz Hoheheim got all the hoes',
  `Zoos`,
  'idk, but he sure uses a lot of *greece*',
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
    setTimeout(()=> joking = false, 5 * 60 * 1000);
  }
  if (!eventHandlerAttached) {
    context.client.on('messageCreate', (msg) => onMessageCreate(msg));
    eventHandlerAttached = true;
  }
  context.interaction.reply({content: 'joke mode activated', ephemeral: true});
  return true;
}
