/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {l10n} from '../../src/l10n.js';
import {waitAsync} from '../../src/utils.js';

const commandName = 'joke';
const cooldown  = 30;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {locale, interaction} = context;

  const jokeBase = l10n.s(locale, 'joke.aow');
  const jokeIdx = Math.floor(Math.random() * jokeBase.length);
  const joke = jokeBase[jokeIdx];

  const Credit =
      l10n.t(locale, 'cmd.joke.result.credit', '{NAME}', joke.credit);

  if (joke.question) {
    interaction
        .reply({
          embeds: [{
            color: 0x3271a6,
            description: joke.question,
          }],
        })
        .then(() => waitAsync(5))
        .then(() => interaction
            .editReply({
              embeds: [
                {
                  color: 0x3271a6,
                  description: joke.question,
                },
                {
                  color: 0xea4335,
                  description: joke.answer,
                  footer: {text: Credit},
                },
              ],
            }));
  } else {
    interaction
        .reply({
          embeds: [{
            color: 0x3271a6,
            description: joke.joke,
            footer: {text: Credit},
          }],
        });
  }

  return true;
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
