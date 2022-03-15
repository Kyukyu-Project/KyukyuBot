import {readFileSync, writeFileSync, readdirSync, statSync} from 'fs';
import {join, extname} from 'path';
import discordJs from 'discord.js';

const {
  Collection,
} = discordJs;

/**
 * Regular expression that extracts ID from a user mention
 * like `<@81440962496172032>`
 * @type {RegExp}
 */
const USERS_PATTERN = /<@!?(\d{17,19})>/;

/**
 * Regular expression that extracts ID from a role mention
 * like `<@&297577916114403338>`
 * @type {RegExp}
 */
const ROLES_PATTERN = /<@&(\d{17,19})>/;

/**
 * Regular expression that extracts ID from a channel mention
 * like `<#222079895583457280>`
 * @type {RegExp}
 */
const CHANNELS_PATTERN = /^<#(\d{17,19})>$/;

/**
 * Regular expression that extracts a snowflake ID
 * like `222079895583457280`
 * @type {RegExp}
 */
const SNOWFLAKE_PATTERN = /^\d{17,19}$/;

/**
* Get channel id from a text token
* @param {string} mention - channel mention (<#...>) or channel id
* @return {string|null} - return string on match, and null on fail
*/
export function getChannelId(mention) {
  if (mention.startsWith('<')) {
    return CHANNELS_PATTERN.exec(mention)?.[1] || null;
  } else {
    return SNOWFLAKE_PATTERN.exec(mention)?.[0] || null;
  }
}

/**
* Get user id from a text token
* @param {string} mention - user mention (<@!...>) or user id
* @return {string|null}
*/
export function getUserId(mention) {
  if (mention.startsWith('<')) {
    return USERS_PATTERN.exec(mention)?.[1] || null;
  } else {
    return SNOWFLAKE_PATTERN.exec(mention)?.[0] || null;
  }
}

/**
* Get role id from a text token
* @param {string} mention - role mention (<@&...>) or role id
* @return {string|null}
*/
export function getRoleId(mention) {
  if (mention.startsWith('<')) {
    return ROLES_PATTERN.exec(mention)?.[1] || null;
  } else {
    return SNOWFLAKE_PATTERN.exec(mention)?.[0] || null;
  }
}

/**
* @param {string} filePath - file path
* @return {Collection}
*/
export function createCollectionFromFile(filePath) {
  try {
    const sourceText = readFileSync(filePath, 'utf8');
    return new Collection(Object.entries(JSON.parse(sourceText)));
  } catch (error) {
    console.error(`Error reading ${filePath}`);
    return new Collection();
  }
}

/**
* @param {string[]} filePaths - List of file paths
* @return {Collection}
*/
export function createCollectionFromFiles(filePaths) {
  const collection = new Collection();
  filePaths.forEach( (filepath) => {
    try {
      const sourceText = readFileSync(filepath, 'utf8');
      const entries = Object.entries(JSON.parse(sourceText), 'utf8');
      for (const [key, value] of entries) collection.set(key, value);
    } catch (error) {
      console.error(`Error reading ${filepath}`);
    }
  });
  return collection;
}

/**
 * Flatten an object
 * @param {object} obj - The object to flatten
 * @param {string} prefix - The prefix to add before each key
 * @param {object} result - Result object for chaining
 * @return {object}
 **/
function flattenObject(obj, prefix = '', result = {}) {
  prefix = (prefix == '')?'':prefix + '.';
  for (const i in obj) {
    if (obj.hasOwnProperty(i)) {
      if ((typeof obj[i]) === 'object' && !Array.isArray(obj[i])) {
        flattenObject(obj[i], prefix + i, result);
      } else {
        result[prefix + i] = obj[i];
      }
    }
  }
  return result;
};

/**
* Create a new Collection object from a JSON file (flattened)
* @param {string} filePath - file path
* @return {Collection}
*/
export function createFlattenedCollectionFromFile(filePath) {
  try {
    const sourceText = readFileSync(filePath, 'utf8');
    const flattened = flattenObject(JSON.parse(sourceText));
    return new Collection(Object.entries(flattened));
  } catch (error) {
    console.error(`Error reading ${filePath}`);
    return new Collection();
  }
}

/**
 * Create a new Collection object from multiple JSON files (flattened)
 * @param {string[]} filePaths - List of file paths
 * @return {Collection}
 */
export function createFlattenedCollectionFromFiles(filePaths) {
  const collection = new Collection();
  filePaths.forEach( (filepath) => {
    try {
      const sourceText = readFileSync(filepath, 'utf8');
      const flattened = flattenObject(JSON.parse(sourceText));
      const entries = Object.entries(flattened);
      for (const [key, value] of entries) {
        // if collection.get(key) already exists,
        // join the values if they are both arrays
        // otherwise, overwrite with the new value
        if (collection.has(key)) {
          const original = collection.get(key);
          if ((Array.isArray(original)) && (Array.isArray(value))) {
            collection.set(key, original.concat(value));
          } else {
            console.warn(`Overwriting collection key '${key}'`);
            collection.set(key, value);
          }
        } else {
          collection.set(key, value);
        }
      }
    } catch (error) {
      console.error(`Error reading ${filepath}`);
    }
  });
  return collection;
}

/**
* Convert JSON source text to a Collection object
* @param {Collection} sourceCollection - Source Collection object
* @param {string} filePath - File destination
*/
export function saveCollectionToFile(sourceCollection, filePath) {
  try {
    const destText = JSON.stringify(Object.fromEntries(sourceCollection));
    writeFileSync(filePath, destText);
  } catch (error) {
    console.error(`Error writing to ${filePath}`);
  }
}

/**
* Get all files of certain file types in a directory
* @param {string} dir - Directory
* @param {string[]} fileTypes - File types
* @param {number} maxDepth - How deep into the sub-directories
* @return {string[]} - File list
*/
export function getFilesFromDir(dir, fileTypes, maxDepth) {
  maxDepth = Number.isInteger(maxDepth)?maxDepth:0;
  const results = [];

  const traverse = (parentPath, currentDepth) => {
    readdirSync(parentPath).forEach((file) => {
      const currentPath = join(parentPath, file);
      if (statSync(currentPath).isFile()) {
        if (fileTypes.indexOf(extname(currentPath)) != -1) {
          results.push(currentPath);
        }
      } else if (statSync(currentPath).isDirectory()) {
        if (currentDepth < maxDepth) traverse(currentPath, currentDepth + 1);
      }
    });
  };
  traverse(dir, 0);
  return results;
}

/**
 * Parse command arguments
 * @param {string} prefix
 * @param {string} text
 * @return {object}
 */
export function parseCommandArguments(prefix, text) {
  const NOT_FOUND = -1;
  const SPACE = ' ';
  const TAB = '\t';

  /** starting position */
  let idxStart = prefix.length;

  /** temporary char variable */
  let chr = text.charAt(idxStart);

  if (!(text.startsWith(prefix)) || (chr == SPACE) || (chr == TAB)) {
    return [];
  }

  // Get first line only
  let breakPoint = text.indexOf('\r');
  if (breakPoint !== NOT_FOUND) text = text.slice(0, breakPoint);
  breakPoint = text.indexOf('\n');
  if (breakPoint !== NOT_FOUND) text = text.slice(0, breakPoint);

  const OPENING_QUOTES = ['\'', '"', '“', '‘', '„', '‚', '«', '‹'];
  const CLOSING_QUOTES = ['\'', '"', '”', '’', '”', '’', '»', '›'];

  const lastCharPos = text.length - 1;
  const args = [];

  /** temporary token variable */
  let token;

  let getNextToken = true;
  while (getNextToken) {
    const quoteIdx = OPENING_QUOTES.indexOf(chr);
    if (quoteIdx !== NOT_FOUND) {
      // Find closing quote
      const closingQuote = CLOSING_QUOTES[quoteIdx];
      const closingQuotePos = text.indexOf(closingQuote, idxStart+1);

      if (closingQuotePos == NOT_FOUND) {
        getNextToken = false; // Invalid token: no closing quote
      } else {
        idxStart++;
        token = text.substring(idxStart, closingQuotePos);

        if (closingQuotePos == lastCharPos) { // Last token (end of line)
          args.push(token);
          getNextToken = false;
        } else {
          idxStart = closingQuotePos + 1;
          chr = text.charAt(idxStart);
          if (chr !== SPACE && chr !== TAB) { // Invalid token
            // Closing quote not followed by a space/tab
            getNextToken = false;
          } else { // Valid token
            args.push(token);
            getNextToken = true;
          }
        }
      }
    } else {
      // Find next character that is is space or EOL
      let idxEnd = idxStart;
      while (idxEnd < lastCharPos) {
        idxEnd++;
        chr = text.charAt(idxEnd);
        if ((chr == SPACE) || (chr == TAB)) break;
      };
      if (idxEnd == lastCharPos) {
        token = text.substring(idxStart).trim();
        args.push(token);
        getNextToken = false;
      } else {
        token = text.substring(idxStart, idxEnd);
        args.push(token);
        idxStart = idxEnd;
        getNextToken = true;
      }
    }

    if (getNextToken) {
      // Find next character that is is not space or EOL
      while (idxStart < lastCharPos) {
        idxStart ++;
        chr = text.charAt(idxStart);
        if ((chr !== SPACE) && (chr != TAB)) break;
      };
      getNextToken = (idxStart <= lastCharPos);
    }
  } // while (nextToken)

  return args;
}

/**
 * Asynchronously pause for a few seconds
 * @param {number} seconds Number of seconds
 * @return {Promise}
 */
export async function pause(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Hard stop the process for a few seconds
 * @param {number} seconds Number of seconds
 * @return {Promise}
 */
export async function wait(seconds) {
  await pause(seconds);
}
