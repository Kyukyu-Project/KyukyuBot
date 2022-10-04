/**
 * Utility functions related to objects
 */

import fs from 'fs';
import url from 'url';

/**
 * Key-value pair object
 * @typedef {Object.<string, (string|number|boolean|Array)>} Dictionary
 *
 * A simple map
 * @typedef {Map<string, string|number|boolean|Array|Dictionary>} SimpleMap
 *
 * A nested map
 * @typedef {Map<string, string|number|boolean|Array|NestedMap>} NestedMap
 */

/**
 * @typedef {'string' | 'number' | 'boolean' |
 * 'null' | 'undefined' | 'function' |
 * 'set'  | 'array' |
 * 'date' | 'object' } ObjectType
 */

/**
 * Get the type of a source project
 * @param {Object} source
 * @return {ObjectType}
 */
function getObjectType(source) {
  const type = typeof source;

  if (type !== 'object') {
    // string, number, boolean, undefined, function
    return type;
  }

  if (Array.isArray(source)) return 'array';

  if (source === null) return 'null';
  if (source instanceof Date) return 'date';
  if (source instanceof Set) return 'set';
  if (source instanceof Map) return 'map';
  // if (source instanceof RegExp) return 'regexp';
  return 'object';
}

/**
 * Read a JSON file and return it as a object
 * @param {string|URL} filePath - File path of the target file
 * @param {Function} [reviver] - Transformer function for values
 * @return {Dictionary}
 */
export function readJson(filePath, reviver) {
  if (filePath.constructor.name === 'URL') {
    filePath = url.fileURLToPath(filePath);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');

  if (typeof reviver === 'function') {
    return JSON.parse(fileContent, reviver);
  } else {
    return JSON.parse(fileContent);
  }
}

/**
* Save an object to JSON file
* @param {Object} source - Source object
* @param {string} filePath - File destination
*/
export function saveJson(source, filePath) {
  /**
   * Convert an object to a primitive, Array, or dictionary object.
   * We do not use `.toJSON()` because Map and Set do not convert properly.
   * @param {number|string|boolean|Array|Object} input - The source object
   * @return {Object.<string, Object>} output - Output
   **/
  function convert(input) {
    const result = {};

    switch (getObjectType(input)) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'date': return input;
      case 'array': return input.map(((el) => convert(el)));
      case 'set': return [...input].map(((el) => convert(el)));
      case 'map':
        for (const [key, value] of input) result[key] = convert(value);
        break;
      case 'object':
        Object.keys(input).forEach((key) => result[key] = convert(input[key]));
        break;
    }
    return result;
  }

  const json = convert(source);
  const destText = JSON.stringify(json, null, 2 /* prettify */);
  fs.writeFileSync(filePath, destText);
}

/**
 * Transform an object to a map
 * @param {Object} source - The source object
 * @return {SimpleMap}
 */
export function objectToMap(source) {
  return new Map(Object.entries(source));
}

/**
 * Build resource from resource-builder file(s)
 * @param {string|string[]} filePaths - File path(s) of source files
 * @param {Function} [transformer] - Transformer function for values
 * @return {Map}
 */
export function buildResource(filePaths, transformer) {
  const resourceMap = new Map();

  if (typeof transformer !== 'function') {
    // Ignore $schema and $comment
    transformer = (k, v) => k.startsWith('$')?undefined:v;
  }

  if (!Array.isArray(filePaths)) filePaths = [filePaths];

  filePaths.forEach((path) => {
    const source = readTJson(path, transformer, {flatten: true});
    Object.keys(source).forEach((key) => {
      if (!resourceMap.has(key)) {
        resourceMap.set(key, source[key]);
      } else {
        const prevValue = resourceMap.get(key);
        const prevType = getObjectType(prevValue);
        const newValue = source[key];
        const newType = getObjectType(newValue);

        if ((prevType === 'array') && (newType === 'array')) {
          resourceMap.set(key, prevValue.concat(newValue));
        } else if ((prevType === 'set') && (newType === 'set')) {
          resourceMap.set(key, new Set([...prevValue, ...newValue]));
        } else {
          throw new Error(`Error: cannot overwrite resource key "${key}"`);
        }
      }
    });
  });

  return resourceMap;
}

/**
 * Get a list of filtered keys of an object
 * @param {Object} source
 * @return {string[]}
 */
function getFilteredKeys(source) {
  return Object.keys(source).filter((k) => !k.startsWith('$'));
}

/**
 * Return a text value from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {string}
 */
function typecastText(source, trace) {
  switch (getObjectType(source)) {
    case 'string': return source;
    case 'number': return source.toString();
    case 'boolean': return source.toString();
    case 'null': return '';
    case 'date': return (/** @type Date */ (source)).toISOString();

    case 'set':
      source = [...source];
      return source
          .map((el, idx) => typecastText(el, `${trace}{${idx}}`))
          .join('\n');

    case 'array':
      return source
          .map((el, idx) => typecastText(el, `${trace}[${idx}]`))
          .join('\n');

    case 'object':
      const srcKeys = getFilteredKeys(source);
      if (srcKeys.length === 1) {
        const firstKey = srcKeys[0];
        return typecastText(source[firstKey], `${trace}.${firstKey}`);
      }
      throw new Error(`Error typecasting ${trace} to text`);

    case 'undefined':
    // case 'regex':
      throw new Error(`Error typecasting ${trace} to text`);
  };
};

/**
 * Return a number value from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {number}
 */
function typecastNumber(source, trace) {
  switch (getObjectType(source)) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'date':
      const parsed = Number(source);
      if (Number.isNaN(parsed)) {
        throw new Error(`Error typecasting ${trace} to number`);
      }
      return parsed;

    case 'set':
      source = [...source];
      if (source.length === 0) return 0;
      if (source.length === 1) return typecastNumber(source[0], `${trace}{0}`);
      throw new Error(`Error typecasting ${trace}{} to number`);

    case 'array':
      if (source.length === 0) return 0;
      if (source.length === 1) return typecastNumber(source[0], `${trace}[0]`);
      throw new Error(`Error typecasting ${trace}[] to number`);

    case 'object':
      const srcKeys = getFilteredKeys(source);
      if (srcKeys.length === 1) {
        const firstKey = srcKeys[0];
        return typecastNumber(source[firstKey], `${trace}.${firstKey}`);
      }
      throw new Error(`Error typecasting ${trace} to number`);

    case 'undefined':
    // case 'regex':
      throw new Error(`Error typecasting ${trace} to number`);
  };
};

/**
 * Return a boolean value from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {number}
 */
function typecastBoolean(source, trace) {
  switch (getObjectType(source)) {
    case 'string':
      if (source === 'true') return true;
      if (source === 'false') return false;
      throw new Error(`Error typecasting ${trace}{} to boolean`);
    case 'number':
      if (source === 1) return true;
      if (source === 0) return false;
      throw new Error(`Error typecasting ${trace}{} to boolean`);
    case 'boolean':
      return source;
    case 'null':
      return false;
    case 'date':
      throw new Error(`Error typecasting ${trace}{} to boolean`);

    case 'set':
      source = [...source];
      if (source.length === 0) return false;
      if (source.length === 1) return typecastBoolean(source[0], `${trace}{0}`);
      throw new Error(`Error typecasting ${trace}{} to number`);

    case 'array':
      if (source.length === 0) return false;
      if (source.length === 1) return typecastBoolean(source[0], `${trace}[0]`);
      throw new Error(`Error typecasting ${trace}[] to number`);

    case 'object':
      const srcKeys = getFilteredKeys(source);
      if (srcKeys.length === 1) {
        const firstKey = srcKeys[0];
        return typecastBoolean(source[firstKey], `${trace}.${firstKey}`);
      }
      throw new Error(`Error typecasting ${trace} to boolean`);

    case 'undefined':
    // case 'regex':
      throw new Error(`Error typecasting ${trace} to boolean`);
  };
};

/**
 * Return a date value from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {number}
 */
function typecastDate(source, trace) {
  switch (getObjectType(source)) {
    case 'string':
      const parsed =  Date.parse(source);
      if (Number.isNaN(parsed)) {
        throw new Error(`Error typecasting ${trace} to date`);
      }
      return parsed;

    case 'number':
      if (Number.isInteger(source)) return new Date(source);
      throw new Error(`Error typecasting ${trace}{} to date`);

    case 'boolean':
    case 'null':
      throw new Error(`Error typecasting ${trace}{} to date`);

    case 'date':
      return source;

    case 'set':
      source = [...source];
      if (source.length === 1) return typecastDate(source[0], `${trace}{0}`);
      throw new Error(`Error typecasting ${trace}{} to date`);

    case 'array':
      if (source.length === 1) return typecastDate(source[0], `${trace}[0]`);
      if (source.length === 3) {
        const date = new Date(source);
        if (!Number.isNaN(date.valueOf())) return date;
      }
      throw new Error(`Error typecasting ${trace}[] to date`);

    case 'object':
      const srcKeys = getFilteredKeys(source);
      if (srcKeys.length === 1) {
        const firstKey = srcKeys[0];
        return typecastDate(source[firstKey], `${trace}.${firstKey}`);
      }
      throw new Error(`Error typecasting ${trace} to date`);

    case 'undefined':
    // case 'regex':
      throw new Error(`Error typecasting ${trace} to date`);
  };
};

/**
 * Return a array value from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Array}
 */
function typecastArray(source, trace) {
  switch (getObjectType(source)) {
    case 'set': return [...source];
    case 'array': return source;

    case 'undefined':
      throw new Error(`Error typecasting ${trace} to array`);

    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'date':
    // case 'regex':
    case 'object':
      // const srcKeys = Object.keys(source).filter((k) => !k.startsWith('$'));
      // return srcKeys.map((key) => source[key]);
      return [source];
  };
}

/**
 * Return a typed array from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @param {Function} transformer - Typecasting function for child elements
 * @param {ObjectType} typecastTo - Type of child elements
 * @return {Array}
 */
function typecastTypedArray(source, trace, transformer, typecastTo) {
  switch (getObjectType(source)) {
    case 'set': return [...source]
        .map((el, idx) => transformer(el, `${trace}{${idx}}`));
    case 'array': return source
        .map((el, idx) => transformer(el, `${trace}[${idx}]`));

    case 'undefined':
      throw new Error(`Error typecasting ${trace} to ${typecastTo} array`);

    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'date': return [transformer(source, trace)];
    // case 'regex':
    case 'object':
      // const srcKeys = Object.keys(source).filter((k) => !k.startsWith('$'));
      // return srcKeys.map((key) => transformer(el, `${trace}.${key}`));
      return [transformer(source, trace)];
  };
}

/**
 * Return a text array from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Array}
 */
function typecastTextArray(source, trace) {
  return typecastTypedArray(source, trace, typecastText, 'text');
}

/**
 * Return a number array from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Array}
 */
function typecastNumberArray(source, trace) {
  return typecastTypedArray(source, trace, typecastNumber, 'number');
}

/**
 * Return a boolean array from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Array}
 */
function typecastBooleanArray(source, trace) {
  return typecastTypedArray(source, trace, typecastBoolean, 'boolean');
}

/**
 * Return a date array from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Array}
 */
function typecastDateArray(source, trace) {
  return typecastTypedArray(source, trace, typecastDate, 'date');
}


/**
 * Return a set value from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Set}
 */
function typecastSet(source, trace) {
  switch (getObjectType(source)) {
    case 'set': return source;
    case 'array': return new Set(source);

    case 'undefined':
      throw new Error(`Error typecasting ${trace} to set`);

    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'date':
    // case 'regex':
    case 'object': return new Set(source);
  };
}

/**
 * Return a typed set from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @param {Function} transformer - Typecasting function for child elements
 * @param {ObjectType} typecastTo - Type of child elements
 * @return {Set}
 */
function typecastTypedSet(source, trace, transformer, typecastTo) {
  switch (getObjectType(source)) {
    case 'set': return new Set([...source]
        .map((el, idx) => transformer(el, `${trace}{${idx}}`)),
    );
    case 'array': return new Set(source
        .map((el, idx) => transformer(el, `${trace}[${idx}]`)),
    );

    case 'undefined':
      throw new Error(`Error typecasting ${trace} to ${typecastTo} array`);

    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'date': return [transformer(source, trace)];
    // case 'regex':
    case 'object':
      // const srcKeys = Object.keys(source).filter((k) => !k.startsWith('$'));
      // return srcKeys.map((key) => transformer(el, `${trace}.${key}`));
      return new Set(transformer(source, trace));
  };
}

/**
 * Return a text set from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Array}
 */
function typecastTextSet(source, trace) {
  return typecastTypedSet(source, trace, typecastText, 'text');
}

/**
 * Return a number set from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Array}
 */
function typecastNumberSet(source, trace) {
  return typecastTypedSet(source, trace, typecastNumber, 'number');
}

/**
 * Return a boolean set from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Array}
 */
function typecastBooleanSet(source, trace) {
  return typecastTypedArray(source, trace, typecastBoolean, 'boolean');
}

/**
 * Return a date set from a t-json element
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Array}
 */
function typecastDateSet(source, trace) {
  return typecastTypedSet(source, trace, typecastDate, 'date');
}

/**
 * Process value of an flat object
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Object}
 */
function buildFlat(source, trace) {
  if (!trace) trace = '$root';

  switch (getObjectType(source)) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'date':
      return source;

    case 'set':
      const newSet = new Set();
      [...source].forEach((el, idx) => {
        el = buildObject(el, `${trace}{${idx}}`);
        delete el['$escape'];
        newSet.add(el);
      });
      return newSet;

    case 'array': return source
        .map((el, idx) => {
          el = buildObject(el, `${trace}[${idx}]`);
          delete el['$escape'];
          return el;
        });

    case 'undefined': throw new Error(`Error processing ${trace}`);
    // case 'regex':
    case 'object':
  };

  /** Result */
  const result = {};

  Object
      .keys(source)
      .filter((key) => !key.startsWith('$'))
      .forEach((key) => {
        /**
         * For each key
         * 1. Process the value
         * 2. Typecast the processed value
         * 3. Add the key-value to the result
         * */
        const value = source[key];
        let newKey = key;

        /** Escape serialization? */
        let escapeSerialization = false;

        let processor = buildFlat; // process function
        let converter = (el) => el; // typecast function

        if (key.endsWith('>')) {
          const keyEnd = key.lastIndexOf('<');
          let typecastTo = key.slice(keyEnd + 1, -1);

          switch (typecastTo) {
            case 'text': converter = typecastText; break;
            case 'boolean': converter = typecastBoolean; break;
            case 'number': converter = typecastNumber; break;
            case 'date': converter = typecastDate; break;
            case 'object':
              escapeSerialization = true;
              processor = buildObject;
              break;
            case 'flat':
              escapeSerialization = true;
              processor = buildFlat;
              break;

            // ------------------ Array and Typed Array ------------------
            case 'array':
            case '[]': converter = typecastArray; break;
            case '[text]': converter = typecastTextArray; break;
            case '[boolean]': converter = typecastBooleanArray; break;
            case '[number]': converter = typecastNumberArray; break;
            case '[date]': converter = typecastDateArray; break;

            // -------------------- Set and Typed Set --------------------
            case 'set':
            case '{}': converter = typecastSet; break;
            case '{text}': converter = typecastTextSet; break;
            case '{boolean}': converter = typecastBooleanSet; break;
            case '{number}': converter = typecastNumberSet; break;
            case '{date}': converter = typecastDateSet; break;
            default:
              typecastTo = ''; // Unknown
          }
          if (typecastTo !== '') {
            newKey = key.slice(0, keyEnd);
            if (newKey === '') newKey = '.';
          }
        }

        const processed = processor(value, `${trace}.${key}`);
        const converted = converter(processed, `${trace}.${key}`);

        if (converted === undefined) {
          throw new Error(`Error processing ${trace}.${key}`);
        }

        // TODO: duplicate key error detection

        if (getObjectType(converted) !== 'object') {
          result[newKey] = converted;
        } else {
          if (escapeSerialization || (converted['$escape'])) {
            converted['$escape'] = true; // Tag this value first.
            result[newKey] = converted;
          } else {
            Object.keys(converted).forEach((subKey) => {
              const serialized = (subKey === '.')?newKey:`${newKey}.${subKey}`;
              result[serialized] = converted[subKey];
            });
          }
        }
      });

  const resKeys = Object.keys(result);

  // Collapse the object if it contains only one key named '.'
  if ((resKeys.length === 1) && (resKeys[0] === '.')) {
    return result[resKeys[0]];
  } else {
    resKeys.forEach((key) => delete result[key]['$escape']);
    return result;
  }
}

/**
 * Process value of an object
 * @param {Object} source - Source object
 * @param {string} trace - Trace from the tree root (for debugging purpose)
 * @return {Object}
 */
function buildObject(source, trace) {
  if (!trace) trace = '$root';

  switch (getObjectType(source)) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'date':
      return source;

    case 'set':
      const newSet = new Set();
      [...source].forEach((el, idx) => {
        el = buildObject(el, `${trace}{${idx}}`);
        delete el['$escape'];
        newSet.add(el);
      });
      return newSet;

    case 'array': return source
        .map((el, idx) => {
          el = buildObject(el, `${trace}[${idx}]`);
          delete el['$escape'];
          return el;
        });

    case 'undefined': throw new Error(`Error processing ${trace}`);
    // case 'regex':
    case 'object':
  };

  /** Result */
  const result = {};

  Object
      .keys(source)
      .filter((key) => !key.startsWith('$'))
      .forEach((key) => {
        /**
         * For each key
         * 1. Process the value
         * 2. Typecast the processed value
         * 3. Add the key-value to the result
         * */
        const value = source[key];
        let newKey = key;

        let processor = buildObject; // process function
        let converter = (el) => el; // typecast function

        if (key.endsWith('>')) {
          const keyEnd = key.lastIndexOf('<');
          let typecastTo = key.slice(keyEnd + 1, -1);

          switch (typecastTo) {
            case 'text': converter = typecastText; break;
            case 'boolean': converter = typecastBoolean; break;
            case 'number': converter = typecastNumber; break;
            case 'date': converter = typecastDate; break;

            case 'object': processor = buildObject; break;
            case 'flat': processor = buildFlat; break;

            // ------------------ Array and Typed Array ------------------
            case 'array':
            case '[]': converter = typecastArray; break;
            case '[text]': converter = typecastTextArray; break;
            case '[boolean]': converter = typecastBooleanArray; break;
            case '[number]': converter = typecastNumberArray; break;
            case '[date]': converter = typecastDateArray; break;

            // -------------------- Set and Typed Set --------------------
            case 'set':
            case '{}': converter = typecastSet; break;
            case '{text}': converter = typecastTextSet; break;
            case '{boolean}': converter = typecastBooleanSet; break;
            case '{number}': converter = typecastNumberSet; break;
            case '{date}': converter = typecastDateSet; break;
            default:
              typecastTo = ''; // Unknown
          }
          if (typecastTo !== '') {
            newKey = key.slice(0, keyEnd);
            if (newKey === '') newKey = '.';
          }
        }

        const processed = processor(value, `${trace}.${key}`);
        const converted = converter(processed, `${trace}.${key}`);

        if (converted === undefined) {
          throw new Error(`Error processing ${trace}.${key}`);
        }

        // TODO: duplicate key error detection

        result[newKey] = converted;
      });

  const resKeys = Object.keys(result);

  // Collapse the object if it contains only one key named '.'
  if ((resKeys.length === 1) && (resKeys[0] === '.')) {
    return result[resKeys[0]];
  } else {
    resKeys.forEach((key) => delete result[key]['$escape']);
    result['$escape'] = true;
    return result;
  }
}

/**
 * @typedef {Object} TJsonImportOptions
 * @property {boolean} flatten - Flatten the top-level object?
 */

/**
 * Import a t-json object
 * @param {string|URL} filePath - File path of the target file
 * @param {Function} [reviver] - Transformer function for values
 * @param {TJsonImportOptions} [options] - Import options
 * @return {Object}
 */
export function readTJson(filePath, reviver, options) {
  const source = readJson(filePath, reviver);
  if (options?.flatten === true) return buildFlat(source, '$root');
  return buildObject(source, '$root');
}
