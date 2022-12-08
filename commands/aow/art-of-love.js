/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

export const commandName = 'art-of-love';
export const cooldown  = 3;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
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
