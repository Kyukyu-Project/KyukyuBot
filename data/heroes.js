import {resolve} from 'path';
import {readFileSync} from 'fs';
const dataFilePath = new URL('./heroes.json', import.meta.url);

const data = JSON.parse(readFileSync(dataFilePath, 'utf8'));
export default data.heroes;
