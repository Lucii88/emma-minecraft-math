// Seznam všech anglických promluv Školního ostrova pro nahrávky.
// Spuštění: npx vite-node scripts/hlas/texty.ts -- <výstup.json> [počet semínek]
import { writeFileSync } from 'node:fs';
import { skills } from '../../src/content/skola';
import { allSpeech } from '../../src/content/skola/hlas';

const [out, seeds] = process.argv.slice(2).filter((a) => a !== '--');
const texts = allSpeech(skills, Number(seeds ?? 4000));
writeFileSync(out, JSON.stringify(texts, null, 1));
console.log(`${texts.length} promluv → ${out}`);
