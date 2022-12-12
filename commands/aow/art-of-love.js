/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

const commandName = 'art-of-love';
const cooldown  = 3;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
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

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
