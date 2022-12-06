/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {l10n} from '../../src/l10n.js';
import {waitAsync} from '../../src/utils.js';

const commandName = 'trivia';
const cooldown  = 10;

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
  while (m) { // While there remain elements to shuffle…
    i = Math.floor(Math.random() * m--); // Pick a remaining element…
    t = result[m]; // And swap it with the current element.
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
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {locale, channel, interaction} = context;
  const {options} = interaction;

  const triviaTitle = l10n.s(locale, 'cmd.trivia.trivia-title');
  const questionLabel = l10n.s(locale, 'cmd.trivia.question-label');
  const choicesLabel = l10n.s(locale, 'cmd.trivia.choices-label');
  const answerLabel = l10n.s(locale, 'cmd.trivia.answer-label');
  const noteLabel = l10n.s(locale, 'cmd.trivia.note-label');
  const tallyMessage = l10n.s(locale, 'cmd.trivia.tally-message');
  const finalScore = l10n.s(locale, 'cmd.trivia.final-scoring');
  const finalScoreLine = l10n.s(locale, 'cmd.trivia.final-scoring-line');
  const resCorrect = l10n.s(locale, 'cmd.trivia.response-correct');
  const resIncorrect = l10n.s(locale, 'cmd.trivia.response-incorrect');
  const resAlreadyAnswered = l10n.s(
      locale,
      'cmd.trivia.response-already-answered',
  );

  const subjectId = options.getString('subject');
  const subjectTitle = l10n
      .s(locale, 'trivia.library')
      .find((el) => el.id === subjectId)
      .title;

  const triviaBase = l10n.s(locale, 'trivia.' + subjectId);

  let roundCount = options?.getInteger('rounds') || 10;
  roundCount = Math.floor(Math.min(roundCount, triviaBase.length * 0.3));

  const openingGif = l10n.s(locale, 'cmd.trivia.opening-gif');
  const openingMsg = l10n.t(
      locale, 'cmd.trivia.opening-message',
      '{SUBJECT}', subjectTitle,
  );

  /** List of trivia quizzes (not randomized) */
  const picked = new Set();
  for (let i = 0; i < roundCount; i++) {
    let pick = Math.floor(Math.random() * triviaBase.length);
    while (picked.has(pick)) {
      pick = Math.floor(Math.random() * triviaBase.length);
    }
    picked.add(pick);
  }

  /** List of trivia quizzes (randomized) */
  const quizzes = Array.from(picked).map((pick) => (
    prepareQuiz(triviaBase[pick])
  ));

  let rIndex = 0;
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
    const quiz = quizzes[rIndex];
    const quizEmbed = {
      title: l10n.r(triviaTitle, '{NUMBER}', rIndex + 1, '{COUNT}', roundCount),
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
          {name: noteLabel, value: quiz['answer-note']},
      );
    }

    const quizContent = {embeds: [quizEmbed], components: []};

    quizMessage.edit(quizContent);

    currentRoundWinners.forEach((userId) => {
      scores.set(userId, (scores.get(userId)||0) + 1);
    });

    rIndex++;
    if (rIndex < roundCount) {
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
    const quiz = quizzes[rIndex];
    const quizEmbed = {
      title: l10n.r(triviaTitle, '{NUMBER}', rIndex + 1, '{COUNT}', roundCount),
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
  await waitAsync(1);
  await channel.send(openingMsg);
  await waitAsync(10);
  postNextQuiz(0);
  return true;
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
