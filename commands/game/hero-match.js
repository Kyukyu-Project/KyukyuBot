/**
 * @typedef {import('../src/typedef.js').CommandContext} CommandContext
 */

// import {l10n} from '../../src/l10n.js';
// import {waitAsync} from '../../src/utils.js';

export const commandName = 'hero-match';
export const cooldown  = 0;

const Emojis = [
  '❓',
  '<:h_ainz:1045511982977130496>',
  '<:h_chione:1045511956372668546>',
  '<:h_dracula:1045511928715411476>',
  '<:h_drake:1045511901452451910>',
  '<:h_harrison:1045511872230731777>',
  '<:h_zeus:1045511836721758228>',
];

const Buttons = [
  {type: 2, style: 2, emoji: Emojis[0]},
  {type: 2, style: 2, emoji: Emojis[1]},
  {type: 2, style: 2, emoji: Emojis[2]},
  {type: 2, style: 2, emoji: Emojis[3]},
  {type: 2, style: 2, emoji: Emojis[4]},
  {type: 2, style: 2, emoji: Emojis[5]},
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
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction} = context;
  // const {locale, channel, interaction} = context;
  // const {options} = interaction;

  const cards = shuffle([
    1, 1, 4,
    2, 2, 4,
    3, 3, 5,
  ]);

  // const picked = [
  //   false, false, false,
  //   false, false, false,
  //   false, false, false,
  // ];

  const gameContent = {
    content: '**Hero Match game!**\n\nYou have 10s to memorize the cards...',
    components: [
      { // row 1
        type: 1,
        components: [
          Object.assign({custom_id: `card1-1`}, Buttons[cards[0]]),
          Object.assign({custom_id: `card1-2`}, Buttons[cards[1]]),
          Object.assign({custom_id: `card1-3`}, Buttons[cards[2]]),
        ],
      },
      { // row 2
        type: 1,
        components: [
          Object.assign({custom_id: `card2-1`}, Buttons[cards[3]]),
          Object.assign({custom_id: `card2-2`}, Buttons[cards[4]]),
          Object.assign({custom_id: `card2-3`}, Buttons[cards[5]]),
        ],
      },
      { // row 3
        type: 1,
        components: [
          Object.assign({custom_id: `card3-1`}, Buttons[cards[6]]),
          Object.assign({custom_id: `card3-2`}, Buttons[cards[7]]),
          Object.assign({custom_id: `card3-3`}, Buttons[cards[8]]),
        ],
      },
    ],
  };

  interaction.reply(gameContent);
  return true;
}
