/*
 * Resource builder functions
 **/

import {
  joinPath,
  resolvePath,
  findFiles,
  isDirectory,
  readDirectory,
  getModuleDirectory,
  buildResource,
  saveJson,
} from '../src/utils.js';

/**
 * Build resource file
 * @param {string[]} locales - List of locales
 */
export async function buildLocaleResources() {
  /** Module directory (`<project>/build/`) */
  const moduleDir = getModuleDirectory(import.meta);

  /** Import directory (`<project>/build/resources/`) */
  const importDir = resolvePath(moduleDir, './resources/');

  /** Locales currently supported by Discord */
  const DiscordLocales = [
    'bg', 'cs', 'da', 'de', 'el', 'en-GB', 'en-US', 'es-ES',
    'fi', 'fr', 'hi', 'hr', 'hu', 'it', 'ja', 'ko',
    'lt', 'nl', 'no', 'pl', 'pt-BR', 'ro', 'ru', 'sv-SE',
    'th', 'tr', 'uk', 'vi', 'zh-CN', 'zh-TW',
  ];

  console.log('Importing locale resource...');

  const resourceMap = new Map();
  const locales = [];

  resourceMap.set('version', process.env.npm_package_version);
  resourceMap.set('locales', locales);

  readDirectory(importDir).forEach((fileName) => {
    if (DiscordLocales.includes(fileName)) {
      const childPath = joinPath(importDir, fileName);
      if (isDirectory(childPath)) {
        const locale = fileName;
        const resDataFilePaths = findFiles(childPath, ['.json'], 3);
        const resData = buildResource(resDataFilePaths);
        resourceMap.set(locale, resData);
        locales.push(locale);
      }
    }
  });

  /** Export directory (`<project>/resources/` */
  const exportDir = resolvePath(moduleDir, '../resources/');

  /** Export file (`<project>/resources/localization.json` */
  const exportFilePath = joinPath(exportDir, 'localization.json');

  saveJson(resourceMap, exportFilePath);

  console.log('Local resource file (localization.json) built');
}
