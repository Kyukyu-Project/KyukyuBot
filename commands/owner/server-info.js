/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {l10n} from '../../src/l10n.js';

const commandName = 'server-info';
const cooldown  = 0;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {client, locale, channel, interaction} = context;

  // await interaction.deferReply();
  interaction.reply(`**I am on ${client.servers.length} servers.**`);

  const info = [];

  const fns = client.servers.map((g) =>
    client.guilds.fetch(g.id).then((guild) => info.push({
      id: guild.id,
      name: guild.name,
      description: guild.description,
      memberCount: guild.memberCount,
      created: guild.createdTimestamp,
      iconURL: guild.iconURL({format: 'png'}),
    })),
  );

  Promise.all(fns).then(() => {
    info
        .filter((i) => i.memberCount > 99)
        .sort((a, b) => {
          if (a.memberCount > b.memberCount) return -1;
          if (a.memberCount < b.memberCount) return 1;
          return 0;
        })
        .forEach((i) => channel.send({
          embeds: [{
            title: i.name,
            description: l10n.t(
                locale, 'cmd.server-info.result',
                '{DESCRIPTION}', i.description || i.name,
                '{ID}', i.id,
                '{CREATED}', l10n.formatDate(locale, new Date(i.created)),
                '{MEMBER COUNT}', '' + i.memberCount,
            ),
            thumbnail: {url: i.iconURL},
          }],
        }));

    // interaction.editReply(info.length + ' servers');
  });

  return true;
}


/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
