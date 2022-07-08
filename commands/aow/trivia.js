/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import {ChannelType} from 'discord-api-types/v10';

import {pause} from '../../utils/utils.js';

export const canonName = 'fun.trivia';
export const name = 'trivia';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 60;

const defaultCount   = 7;
const minimumCount   = 3;

const OPENING_MSG = `commands.${canonName}.opening-message`;
const OPENING_GIF = `commands.${canonName}.opening-gif`;
const TRIVIA_TITLE = `commands.${canonName}.trivia-title`;
const QUESTION_LABEL = `commands.${canonName}.question-label`;
const CHOICES_LABEL = `commands.${canonName}.choices-label`;
const ANSWER_LABEL = `commands.${canonName}.answer-label`;
const NOTE_LABEL = `commands.${canonName}.note-label`;
const TALLY_TEMPLATE = `commands.${canonName}.tally-message`;
const FINAL_SCORE = `commands.${canonName}.final-scoring`;
const FINAL_SCORE_LINE = `commands.${canonName}.final-scoring-line`;
const RES_CORRECT = `commands.${canonName}.response-correct`;
const RES_INCORRECT = `commands.${canonName}.response-incorrect`;
const RES_ALREADY_ANSWERED = `commands.${canonName}.response-already-answered`;

const scSetLabel      = 'set';
const optChannelLabel = 'channel';

const scStartLabel    = 'start';
const optSubjectLabel = 'subject';
const optCountLabel   = 'questions';

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
const ButtonE = {type: 2, style: 2, emoji: Emojis[4], custom_id: `trivia.4`};
const ActiveButtonSets = [
  undefined,
  [ButtonA, ButtonB],
  [ButtonA, ButtonB, ButtonC],
  [ButtonA, ButtonB, ButtonC, ButtonD],
  [ButtonA, ButtonB, ButtonC, ButtonD, ButtonE],
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
 * Randomly pick an item from an array
 * @param {String[]} array
 * @return {String}
 */
function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;
  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const scSetHint = l10n.s(lang, `commands.${canonName}.sc-set-hint`);
  const optChannelHint = l10n.s(lang, `commands.${canonName}.opt-channel-hint`);

  const scStartHint = l10n.s(lang, `commands.${canonName}.sc-start-hint`);
  const optSubjectHint = l10n.s(lang, `commands.${canonName}.opt-subject-hint`);
  const optCountHint = l10n.s(lang, `commands.${canonName}.opt-count-hint`);

  const triviaLibrary = l10n.s(lang, 'trivia.library');
  const triviaSubjects = triviaLibrary.map((db) => [db.title, db.key]);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addSubcommand((c) => c
          .setName(scSetLabel)
          .setDescription(scSetHint)
          .addChannelOption((option) => option
              .setName(optChannelLabel)
              .setDescription(optChannelHint)
              .setRequired(true)
              .addChannelType(ChannelType.GuildText),
          ),
      )
      .addSubcommand((c) => c
          .setName(scStartLabel)
          .setDescription(scStartHint)
          .addStringOption((option) => option
              .setName(optSubjectLabel)
              .setDescription(optSubjectHint)
              .setRequired(true)
              .addChoices(triviaSubjects),
          )
          .addNumberOption((option) => option
              .setName(optCountLabel)
              .setDescription(optCountHint)
              .setRequired(false)
              .setMinValue(minimumCount),
          ),
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

  const quiz = {
    question: triviaData['question'],
    correctAnswer: correctAnswer,
    choices: randomizedChoices.map((ans, idx) => `${Emojis[idx]} ${ans}`),
  };

  if (triviaData['answer-note']) {
    quiz['answer-note'] = triviaData['answer-note'];
  }
  return quiz;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, channel, interaction} = context;
  const {l10n} = client;

  const subCommand = interaction.options.getSubcommand();
  if (subCommand === scSetLabel) {
    // Sub command not implemented yet
    return true;
  }

  const triviaTitle = l10n.s(lang, TRIVIA_TITLE);
  const questionLabel = l10n.s(lang, QUESTION_LABEL);
  const choicesLabel = l10n.s(lang, CHOICES_LABEL);
  const answerLabel = l10n.s(lang, ANSWER_LABEL);
  const noteTitle = l10n.s(lang, NOTE_LABEL);
  const tallyMessage = l10n.s(lang, TALLY_TEMPLATE);
  const finalScore = l10n.s(lang, FINAL_SCORE);
  const finalScoreLine = l10n.s(lang, FINAL_SCORE_LINE);

  const resCorrect = l10n.s(lang, RES_CORRECT);
  const resIncorrect = l10n.s(lang, RES_INCORRECT);
  const resAlreadyAnswered = l10n.s(lang, RES_ALREADY_ANSWERED);

  const options = interaction.options;

  const subjectKey = options.getString(optSubjectLabel);
  const subjectTitle = l10n
      .s(lang, 'trivia.library')
      .find((el) => el.key === subjectKey)
      .title;
  const triviaBase = l10n.s(lang, 'trivia.' + subjectKey);

  let qCount = options?.getNumber(optCountLabel) || defaultCount;
  qCount = Math.floor(Math.min(qCount, triviaBase.length * 0.3));

  const openingGif = l10n.s(lang, OPENING_GIF);
  const openingMsg = l10n.t(lang, OPENING_MSG, '{SUBJECT}', subjectTitle);

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
  const scores = new Map();

  const collectQuizAnswers = async (i) => {
    const buttonId = i.customId;
    const userId = i.user.id;
    const userAnswer = parseInt(buttonId.slice('trivia.'.length));

    if (correctAnswer === userAnswer) {
      if (!currentRoundLosers.has(userId) && !currentRoundWinners.has(userId)) {
        currentRoundWinners.add(userId);
        i.reply({content: randomPick(resCorrect), ephemeral: true});
      } else {
        i.reply({content: randomPick(resAlreadyAnswered), ephemeral: true});
      }
    } else {
      if (!currentRoundLosers.has(userId) && !currentRoundWinners.has(userId)) {
        currentRoundLosers.add(userId);
        i.reply({content: randomPick(resIncorrect), ephemeral: true});
      } else {
        i.reply({content: randomPick(resAlreadyAnswered), ephemeral: true});
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
    if (quiz['answer-note']) {
      quizEmbed.fields.push(
          {name: noteTitle, value: quiz['answer-note']},
      );
    }

    const quizContent = {embeds: [quizEmbed], components: []};

    quizMessage.edit(quizContent);

    currentRoundWinners.forEach((userId) => {
      scores.set(userId, (scores.get(userId)||0) + 1);
    });

    qIndex++;
    if (qIndex < qCount) {
      currentRoundWinners.clear();
      currentRoundLosers.clear();
      postNextQuiz();
    } else {
      const winners = Array
          .from(scores, ([k, v]) => ({userId: k, score: v}))
          .sort((a, b) => {
            if (a.score > b.score) return -1;
            if (a.score < b.score) return 1;
            return 0;
          }).
          slice(0, 5);
      channel.send(
          finalScore +
          winners
              .map((w) => l10n.r(
                  finalScoreLine,
                  '{USER ID}', w.userId,
                  '{SCORE}', w.score))
              .join('\n'),
      );
    }
  };

  const postNextQuiz = async () => {
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
        .createMessageComponentCollector({time: 1 * 30 * 1000});

    quizCollector.on('collect', collectQuizAnswers);
    quizCollector.on('end', tallyQuizAnswers);
  };

  await interaction.reply(openingGif);
  await pause(1);
  await channel.send(openingMsg);
  await pause(30);
  postNextQuiz(0);
  return true;
}
