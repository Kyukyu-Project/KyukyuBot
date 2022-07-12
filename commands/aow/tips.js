/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';

export const canonName = 'aow.tips';
export const name = 'tips';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

/**
 * @param {CommandContext|IContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint);
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {lang, interaction} = context;

  const tips = l10n.s(lang, 'aow.tips');
  let tipIndex = Math.floor(Math.random() * tips.length);

  const titleTemplate = l10n.s(lang, `commands.${canonName}.title`);

  const contentEmbed = {
    title: l10n.r(titleTemplate, '{ID}', tipIndex + 1),
    description: tips[tipIndex],
    footer: {text: l10n.s(lang, 'disclaimer')},
  };

  const navTitle = l10n.s(lang, `commands.${canonName}.tip-navigation`);
  const navComponent = {
    type: 1,
    components: [{
      type: 2 /* button */, style: 2 /* gray */,
      label: l10n.s(lang, `commands.${canonName}.tip-navigation-prev`),
      custom_id: 'tip.prev',
    },
    {
      type: 2, style: 2,
      label: l10n.s(lang, `commands.${canonName}.tip-navigation-next`),
      custom_id: 'tip.next',
    }],
  };

  const contentResponse =
    await interaction.reply({embeds: [contentEmbed], fetchReply: true});

  interaction
      .followUp({
        content: navTitle,
        components: [navComponent],
        fetchReply: true,
        ephemeral: true,
      })
      .then((navResponse) => {
        const collector = navResponse.createMessageComponentCollector({
          time: 5 * 60 * 1000,
          idle: 1 * 60 * 1000,
        });

        collector.on('collect',
            async (i) => {
              if (i.customId === 'tip.prev') {
                if (--tipIndex <= 0) tipIndex = tips.length - 1;
              } else {
                if (++tipIndex >= tips.length) tipIndex = 0;
              }
              contentEmbed.description = tips[tipIndex];
              contentEmbed.title = l10n.r(titleTemplate, '{ID}', tipIndex + 1);
              contentResponse.edit({embeds: [contentEmbed]});
              i.deferUpdate();
            },
        );
      });
  return true;
}

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {lang, channel, message} = context;

  const tips = l10n.s(lang, 'aow.tips');
  const tipIndex = Math.floor(Math.random() * tips.length);

  const titleTemplate = l10n.s(lang, `commands.${canonName}.title`);

  const embed = {
    title: l10n.r(titleTemplate, '{ID}', tipIndex + 1),
    description: tips[tipIndex],
    footer: {text: l10n.s(lang, 'disclaimer')},
  };

  channel.send({
    embeds: [embed],
    reply: {messageReference: message.id},
  });

  return true;
}
