/*
 * Deploy slash commands
 **/

import {resolve, join as joinPath} from 'path';
import {fileURLToPath} from 'url';

import {REST, Routes} from 'discord.js';

import {readJson, objectToMap} from './../src/utils.js';

import {clientConfig} from '../src/app-config.js';
const clientId = clientConfig['client-id'];
const ownerServerId = clientConfig['owner-server-id'];

const thisFilePath = fileURLToPath(import.meta.url);
const importDir = resolve(thisFilePath, './../../resources/');
const importFilePath = joinPath(importDir, 'command-data.json');

/**
 * Deploy command data
 */
(async function() {
  const commandData = objectToMap(readJson(importFilePath));
  const rest = new REST({version: '10'}).setToken(clientConfig['login-token']);

  rest
      .put(
          Routes.applicationCommands(clientId),
          {body: commandData.get('global')},
      )
      .then(()=> console.log('Global application commands deployed'))
      .catch(console.error);

  rest
      .put(
          Routes.applicationGuildCommands(clientId, ownerServerId),
          {body: commandData.get('owner')},
      )
      .then(()=> console.log('Owner application commands deployed'))
      .catch(console.error);

  if (commandData.size > 2) {
    for (const [server, data] of commandData) {
      if ((server !== 'owner') && (server !== 'global')) {
        rest
            .put(
                Routes.applicationGuildCommands(clientId, server),
                {body: data},
            )
            .then(()=> console.log(`<${server}> application commands deployed`))
            .catch(console.error);
      }
    }
  }
})();
