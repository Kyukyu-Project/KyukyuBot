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

const optCountLabel   = 'questions';
const defaultCount   = 7;
const minimumCount   = 3;

const START = `commands.${canonName}.response-start`;
const TRIVIA_TITLE = `commands.${canonName}.trivia-title`;
const QUESTION_LABEL = `commands.${canonName}.question-label`;
const CHOICES_LABEL = `commands.${canonName}.choices-label`;
const ANSWER_LABEL = `commands.${canonName}.answer-label`;
// const TALLY_LABEL = `commands.${canonName}.tally-label`;
const TALLY_TEMPLATE = `commands.${canonName}.tally-message`;
const RES_CORRECT = `commands.${canonName}.response-correct`;
const RES_INCORRECT = `commands.${canonName}.response-incorrect`;
const RES_ALREADY_ANSWERED = `commands.${canonName}.response-already-answered`;

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
// const ButtonADisabled = Object.assign({disabled: true}, ButtonA);
// const ButtonBDisabled = Object.assign({disabled: true}, ButtonB);
// const ButtonCDisabled = Object.assign({disabled: true}, ButtonC);
// const ButtonDDisabled = Object.assign({disabled: true}, ButtonD);
// const ButtonEDisabled = Object.assign({disabled: true}, ButtonE);
const ActiveButtonSets = [
  undefined,
  [ButtonA, ButtonB],
  [ButtonA, ButtonB, ButtonC],
  [ButtonA, ButtonB, ButtonC, ButtonD],
  [ButtonA, ButtonB, ButtonC, ButtonD, ButtonE],
];
// const DisabledButtonSets = [
//   undefined,
//   [ButtonADisabled, ButtonBDisabled],
//   [ButtonADisabled, ButtonBDisabled, ButtonCDisabled],
//   [ButtonADisabled, ButtonBDisabled, ButtonCDisabled, ButtonDDisabled],
//   [ButtonADisabled, ButtonBDisabled, ButtonCDisabled, ButtonDDisabled,
//     ButtonEDisabled],
// ];

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
  const optCountHint = l10n.s(lang, `commands.${canonName}.opt-count-hint`);

  const triviaBase = l10n.s(lang, 'aow.trivia');

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addNumberOption((option) => option
          .setName(optCountLabel)
          .setDescription(optCountHint)
          .setRequired(false)
          .setMinValue(minimumCount)
          .setMaxValue(Math.floor(triviaBase.length * 0.5)),
      );
}

/**
 * @param {object} triviaData
 * @return {object}
 */
function prepareQuiz(triviaData) {
  const choices = triviaData['choices'];
  let randomizedChoices;
  let correctAnswer = triviaData['correct-answer'];

  if (triviaData['order'] === 'fixed') {
    randomizedChoices = choices;
  } else {
    randomizedChoices = shuffle(choices);
    correctAnswer = randomizedChoices.indexOf(choices[correctAnswer]);
  }

  return {
    question: triviaData['question'],
    correctAnswer: correctAnswer,
    choices: randomizedChoices.map((ans, idx) => `${Emojis[idx]} ${ans}`),
  };
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, channel, interaction} = context;
  const {l10n} = client;

  const startMessage = l10n.s(lang, START);

  const triviaTitle = l10n.s(lang, TRIVIA_TITLE);
  const questionLabel = l10n.s(lang, QUESTION_LABEL);
  const choicesLabel = l10n.s(lang, CHOICES_LABEL);
  const answerLabel = l10n.s(lang, ANSWER_LABEL);
  // const tallyTitle = l10n.s(lang, TALLY_LABEL);
  const tallyMessage = l10n.s(lang, TALLY_TEMPLATE);

  const resCorrect = l10n.s(lang, RES_CORRECT);
  const resIncorrect = l10n.s(lang, RES_INCORRECT);
  const resAlreadyAnswered = l10n.s(lang, RES_ALREADY_ANSWERED);

  const options = interaction.options;
  let qCount = options?.getNumber(optCountLabel) || defaultCount;
  qCount = Math.floor(qCount);

  const triviaBase = l10n.s(lang, 'aow.trivia');

  // prepare a list of random trivia
  const picked = new Set();
  for (let i = 0; i < qCount; i++) {
    let pick = Math.floor(Math.random() * triviaBase.length);
    while (picked.has(pick)) {
      pick = Math.floor(Math.random() * triviaBase.length);
    }
    picked.add(pick);
  }

  const quizzes = Array.from(picked).map((pick) => (
    prepareQuiz(triviaBase[pick])
  ));

  let qIndex = 0;
  let correctAnswer;
  let quizMessage;
  const currentRoundWinners = new Set();
  const currentRoundLosers = new Set();

  const collectQuizAnswers = async (i) => {
    const buttonId = i.customId;
    const userId = i.user.id;
    const userAnswer = parseInt(buttonId.slice('trivia.'.length));

    if (correctAnswer === userAnswer) {
      if (!currentRoundLosers.has(userId) && !currentRoundWinners.has(userId)) {
        currentRoundWinners.add(userId);
        i.reply({content: resCorrect, ephemeral: true});
      } else {
        i.reply({content: resAlreadyAnswered, ephemeral: true});
      }
    } else {
      if (!currentRoundLosers.has(userId) && !currentRoundWinners.has(userId)) {
        currentRoundLosers.add(userId);
        i.reply({content: resIncorrect, ephemeral: true});
      } else {
        i.reply({content: resAlreadyAnswered, ephemeral: true});
      }
    }
  };

  const tallyQuizAnswers = () => {
    const winnerCount = currentRoundWinners.size;
    const allCount = winnerCount + currentRoundLosers.size;
    const quiz = quizzes[qIndex];
    const quizEmbed = {
      title: l10n.r(triviaTitle, '{NUMBER}', qIndex + 1, '{COUNT}', qCount),
      fields: [
        {name: questionLabel, value: quiz.question},
        {name: answerLabel, value: quiz.choices[correctAnswer]},
      ],
      footer: {
        text: l10n.r(
            tallyMessage,
            '{CORRECT}', winnerCount,
            '{TOTAL}', allCount),
      },
    };

    const quizContent = {embeds: [quizEmbed], components: []};

    quizMessage.edit(quizContent);

    qIndex++;
    if (qIndex < qCount) {
      currentRoundWinners.clear();
      currentRoundLosers.clear();
      postQuizMessage();
    }
  };

  const postQuizMessage = async () => {
    const quiz = quizzes[qIndex];
    const quizEmbed = {
      title: l10n.r(triviaTitle, '{NUMBER}', qIndex + 1, '{COUNT}', qCount),
      fields: [
        {name: questionLabel, value: quiz.question},
        {name: choicesLabel, value: quiz.choices.join('\n')},
      ],
    };
    correctAnswer = quiz.correctAnswer;

    const quizContent = {
      embeds: [quizEmbed],
      components: [{
        type: 1,
        components: ActiveButtonSets[quiz.choices.length-1],
      }],
    };

    quizMessage = await channel.send(quizContent);

    const quizCollector = quizMessage
        .createMessageComponentCollector({time: 1 * 60 * 1000});

    quizCollector.on('collect', collectQuizAnswers);
    quizCollector.on('end', tallyQuizAnswers);
  };

  interaction.reply(startMessage);
  postQuizMessage(0);
  return true;
}
