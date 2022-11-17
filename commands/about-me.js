/**
 * @typedef {import('../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../src/typedef.js').CommandActionResult} ActionResult
 */

import {execSync} from 'child_process';
import os from 'os';

import {l10n} from '../src/l10n.js';

export const commandName = 'about-kyukyu';
export const cooldown  = 10;

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 **/
function bios(context) {
  const {interaction} = context;
  const {locale} = interaction;

  return ({
    success: true,
    response: l10n.s(locale, 'cmd.about-me.bios-result'),
  });
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 **/
function info(context) {
  const {client, interaction} = context;
  const {locale} = interaction;

  const repoUrl = execSync('git config --get remote.origin.url')
      .toString().trim();
  const gitBranch = execSync('git rev-parse --abbrev-ref HEAD')
      .toString().trim();
  const gitLastCommit = execSync('git rev-parse HEAD')
      .toString().slice(0, 7);

  /**
   * Convert up-time to hh:mm:ss format
   * @param {number} uptime - uptime (in seconds)
   * @return {string}
   */
  function formatUptime(uptime) {
    const pad = (n) => ((n < 10 ? '0' : '') + n);
    const hh = Math.floor(uptime / (60*60));
    const mm = Math.floor(uptime % (60*60) / 60);
    const ss = Math.floor(uptime % 60);
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }

  const embed = {
    fields: [
      {
        name: l10n.s(locale, 'cmd.about-me.info-result.source-code.label'),
        value: l10n.t(
            locale, 'cmd.about-me.info-result.source-code.value',
            '{REPO URL}', repoUrl,
            '{BRANCH}', gitBranch,
            '{HASH}', gitLastCommit,
        ),
      },
      {
        name: l10n.s(locale, 'cmd.about-me.info-result.uptime.label'),
        value: l10n.t(
            locale, 'cmd.about-me.info-result.uptime.value',
            '{BOT UPTIME}', formatUptime(process.uptime()),
            '{SYS UPTIME}', formatUptime(os.uptime()),
        ),
      },
      {
        name: l10n.s(locale, 'cmd.about-me.info-result.servers.label'),
        value: l10n.t(
            locale, 'cmd.about-me.info-result.servers.value',
            '{SERVER COUNT}', client.servers.length,
        ),
      },
    ],
  };

  if (process.env.npm_package_version) {
    embed.fields.unshift(
        {
          name: l10n.s(locale, 'cmd.about-me.info-result.version.label'),
          value: l10n.t(
              locale, 'cmd.about-me.info-result.version.value',
              '{VERSION}', process.env.npm_package_version,
          ),
        },
    );
  }

  return ({
    success: true,
    response: {embeds: [embed]},
  });
}

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction} = context;
  await interaction.deferReply();

  let actionResult;
  switch (interaction.options.getSubcommand()) {
    case 'bios': actionResult = bios(context); break;
    case 'info':
    default: actionResult = info(context);
  }

  interaction.editReply(actionResult.response);

  return actionResult.success;
}
