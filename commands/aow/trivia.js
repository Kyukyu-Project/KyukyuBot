/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'aow.trivia';
export const name = 'trivia';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 60;

const Emojis = [
  '\uD83C\uDDE6',
  '\uD83C\uDDE7',
  '\uD83C\uDDE8',
  '\uD83C\uDDE9',
  '\uD83C\uDDEA',
];
const ButtonA = {type: 2, style: 2, emoji: Emojis[0], custom_id: `trivia.0`};
const ButtonB = {type: 2, style: 2, emoji: Emojis[1], custom_id: `trivia.1`};
const ButtonC = {type: 2, style: 2, emoji: Emojis[2], custom_id: `trivia.2`};
const ButtonD = {type: 2, style: 2, emoji: Emojis[3], custom_id: `trivia.3`};
const ButtonE = {type: 2, style: 2, emoji: Emojis[3], custom_id: `trivia.4`};
const ButtonADisabled = Object.assign({disabled: true}, ButtonA);
const ButtonBDisabled = Object.assign({disabled: true}, ButtonB);
const ButtonCDisabled = Object.assign({disabled: true}, ButtonC);
const ButtonDDisabled = Object.assign({disabled: true}, ButtonD);
const ButtonEDisabled = Object.assign({disabled: true}, ButtonE);
const ActiveButtonSets = [
  undefined,
  [ButtonA, ButtonB],
  [ButtonA, ButtonB, ButtonC],
  [ButtonA, ButtonB, ButtonC, ButtonD],
  [ButtonA, ButtonB, ButtonC, ButtonD, ButtonE],
];
const DisabledButtonSets = [
  undefined,
  [ButtonADisabled, ButtonBDisabled],
  [ButtonADisabled, ButtonBDisabled, ButtonCDisabled],
  [ButtonADisabled, ButtonBDisabled, ButtonCDisabled, ButtonDDisabled],
  [ButtonADisabled, ButtonBDisabled, ButtonCDisabled, ButtonDDisabled,
    ButtonEDisabled],
];

/**
 * Shuffle an array
 * Code copied from https://bost.ocks.org/mike/shuffle/
 * @param {Array} array
 * @return {Array}
 */
function shuffle(array) {
  const result = Array.from(array);
  let m = result.length;
  let t;
  let i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = result[m];
    result[m] = result[i];
    result[i] = t;
  }

  return result;
}

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;
  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint);
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;
  const {l10n} = client;
  const triviaBase = l10n.s(lang, 'aow.trivia');
  const triviaData = triviaBase[Math.floor(Math.random() * triviaBase.length)];
  const thatIsCorrect = l10n.s(
      lang,
      `commands.${canonName}.response-correct`);
  const thatIsIncorrect = l10n.s(
      lang,
      `commands.${canonName}.response-incorrect`);
  const youAnsweredAlready = l10n.s(
      lang,
      `commands.${canonName}.response-already-answered`);

  const choices = triviaData['choices'];
  let randomizedChoices;
  let correctIdx = triviaData['correct-answer'];

  if (triviaData['order'] === 'fixed') {
    randomizedChoices = choices;
  } else {
    randomizedChoices = shuffle(choices);
    correctIdx = randomizedChoices.indexOf(choices[correctIdx]);
  }

  const choiceList = randomizedChoices
      .map((answer, idx) => `${Emojis[idx]} ${answer}`)
      .join('\n');

  const choiceList2 = randomizedChoices
      .map((answer, idx) => (idx === correctIdx)?
          (`${Emojis[idx]} **${answer}**`):
          (`${Emojis[idx]} ${answer}`))
      .join('\n');

  const responseContent = {
    content: triviaData.question + '\n' + choiceList,
    components: [{
      type: 1,
      components: ActiveButtonSets[randomizedChoices.length-1],
    }],
    fetchReply: true,
  };

  const responseContent2 = {
    content: triviaData.question + '\n' + choiceList2,
    components: [{
      type: 1,
      components: DisabledButtonSets[randomizedChoices.length-1],
    }],
  };

  interaction
      .reply(responseContent)
      .then((quizResponse) => {
        const winners = new Set();
        const losers = new Set();

        const quizCollector = quizResponse.createMessageComponentCollector({
          max: 20,
          time: 5 * 60 * 1000,
          idle: 1 * 60 * 1000,
        });

        quizCollector.on('collect',
            async (i) => {
              const buttonId = i.customId;
              const userId = i.user.id;
              const userAnswer = parseInt(buttonId.slice('trivia.'.length));

              if (correctIdx === userAnswer) {
                if (!losers.has(userId) && !winners.has(userId)) {
                  winners.add(userId);
                  i.reply({content: thatIsCorrect, ephemeral: true});
                } else {
                  i.reply({content: youAnsweredAlready, ephemeral: true});
                }
              } else {
                if (!losers.has(userId) && !winners.has(userId)) {
                  losers.add(userId);
                  i.reply({content: thatIsIncorrect, ephemeral: true});
                } else {
                  i.reply({content: youAnsweredAlready, ephemeral: true});
                }
              }
            },
        );

        quizCollector.on('end', (collected) => {
          quizResponse.edit(responseContent2);
        });
      });
  return true;
}
