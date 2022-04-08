import {resolve} from 'path';
import {readFileSync} from 'fs';
const dataFilePath = resolve('data/heroes.json');
const data = JSON.parse(readFileSync(dataFilePath, 'utf8'));
export default data.heroes;
