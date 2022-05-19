/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {
  Modal,
  MessageActionRow,
  TextInputComponent,
  // MessageSelectMenu,
  // MessageButton,
} from 'discord.js';

export const canonName = 'premium.gift';
export const name = 'gift';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 3;
export const guilds = ['658594298983350293']; // AoW official server

let eventHandlerAttached = false;

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  return new SlashCommandBuilder()
      .setName(name) // command name
      .setDescription('send gift another player'); // command hint text
}

// const giftOptions = [
//   {
//     label: '400 Hunting Medals',
//     description: '400 Hunting Medals',
//   },
//   {
//     label: '1000 Mythic Dust',
//     description: '250 Mythic Dust of each kind',
//   },
//   {
//     label: 'Gems + Vouchers',
//     description: '200 Gems + 8 Super Card Vouchers',
//   },
// ];

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, interaction} = context;

  const modal = new Modal()
      .setCustomId('premium.gift.1')
      .setTitle('Premium Gift');

  const recipientInput = new TextInputComponent()
      .setCustomId('recipientInput')
      .setLabel('PvP Id of the recipient')
      .setStyle('SHORT');

  // Arg........ Select menu is not supported :(

  // const giftInput = new MessageSelectMenu()
  //     .setCustomId('giftInput')
  //     .setPlaceholder('Choose what gift you want to send')
  //     .addOptions([
  //       {
  //         label: giftOptions[0].label,
  //         description: giftOptions[0].description,
  //         value: '0',
  //       },
  //       {
  //         label: giftOptions[1].label,
  //         description: giftOptions[1].description,
  //         value: '1',
  //       },
  //       {
  //         label: giftOptions[2].label,
  //         description: giftOptions[2].description,
  //         value: '2',
  //       },
  //     ]);

  const messageInput = new TextInputComponent()
      .setCustomId('messageInput')
      .setLabel('Special message to the recipient')
      .setStyle('PARAGRAPH')
      .setRequired(false);

  const firstActionRow =
    new MessageActionRow().addComponents(recipientInput);
  const secondActionRow =
    new MessageActionRow().addComponents(messageInput);

  modal.addComponents(firstActionRow, secondActionRow);

  await interaction.showModal(modal);

  if (!eventHandlerAttached) {
    client.on('interactionCreate', (i) => {
      if (!i.isModalSubmit()) return;
      const recipient = i.fields.getTextInputValue('recipientInput');
      // const gift = i.fields.getTextInputValue('giftInput');
      const message = i.fields.getTextInputValue('messageInput');

      const embed = {
        'description':
            '**This is just a proof-of-concept of Discord Modal feature**' +
            '\n\nThank you for your generosity.\n\n' +
            'Remember to send Sophia the screenshot of the ' +
            '**100000 Coin purchase** with the purchase number (follow ' +
            '[this link](http://www.armyneedyou.com/support/question/97) ' +
            'on how to find the screenshots on Android or iOS)',
        'fields': [
          {
            'name': 'Recipient\'s PvP Id',
            'value': recipient,
            'inline': true,
          },
          {
            'name': 'Gift',
            'value': // giftOptions[parseInt(gift)].description,
                'Battle Pass',
            'inline': true,
          },
          {
            'name': 'Special Message',
            'value': message || 'none',
          },
        ],
      };
      i.reply({embeds: [embed], fetchReply: true});
    });
    eventHandlerAttached = true;
  }

  return true;
}
