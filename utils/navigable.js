/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('discord.js').Message} Message
 */
/**
 * @param {IContext|CommandContext} context - command context
 * @param {string} content - text content
 * @param {object[]} embeds
 * @param {number[]} users - Ids of users who can interact with this
 * @return {Message}
 */
export async function postNavigable(context, content, embeds, users) {
  const {client, lang, interaction} = context;
  const {l10n} = client;

  const tabOptions = embeds.map((mbd, idx) =>
        (mbd.description && mbd.description.length < 80)?
        ({
          label: mbd.title, value: idx.toString(), description: mbd.description,
        }):
        ({
          label: mbd.title, value: idx.toString(),
        }),
  );

  const components = [{
    type: 1,
    components: [{
      type: 3,
      custom_id: `select`,
      placeholder: l10n.s(lang, `select-placeholder`),
      options: tabOptions,
    }],
  }];

  let currentEmbed = embeds[0];

  // cannot send Embed using interaction.reply due to Discord API bug #2612
  const response = await interaction.channel.send({
    content: content,
    embeds: [currentEmbed],
    components: components,
  });

  const collector = response.createMessageComponentCollector({
    componentType: 'SELECT_MENU',
    time: 10 * 60 * 1000,
    idle: 5 * 60 * 1000,
  });

  collector.on('collect',
      async (i) => {
        if (users.includes(i.user.id)) {
          currentEmbed = embeds[parseInt(i.values[0])];
          i.message.edit({
            content: content,
            embeds: [currentEmbed],
            components: components,
          });
          i.deferUpdate();
        } else {
          i.reply({
            content: l10n.s(lang, 'messages.no-interaction-permission'),
            ephemeral: true,
          });
        }
      },
  );

  collector.on('end', (collected) => {
    response.edit({
      content: content, embeds: [currentEmbed], components: [],
    });
  });

  return response;
}
