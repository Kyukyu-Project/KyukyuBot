import {
  resolvePath,
  isDirectory,
  clearDirectory,
  makeDirectory,
  fileExists,
  getModuleDirectory,
} from '../src/utils.js';

import {buildLocaleResources} from './build-res.js';
import {buildCommandData} from './build-cmd-data.js';
import {l10n} from './../src/l10n.js';

(async function() {
  /** Module directory (`<project>/build/`) */
  const moduleDir = getModuleDirectory(import.meta);

  /** Export directory (`<project>/resources/`) */
  const exportDir = resolvePath(moduleDir, '../resources/');

  /** Make sure we have access to '/resources' directory */
  if (fileExists(exportDir)) {
    if (isDirectory(exportDir)) {
      clearDirectory(exportDir); // Delete previously built files
    } else {
      throw new Error(`Error accessing resource directory (${exportDir})`);
    }
  } else {
    try {
      makeDirectory(exportDir);
    } catch (error) {
      throw new Error(`Error creating resource directory (${exportDir})`);
    }
  }

  await buildLocaleResources();
  await l10n.load();
  await buildCommandData();
})();
