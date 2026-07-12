// Generate 7 icon-style illustrations for game epochs
// Style: Byzantine/Russian Orthodox icon, dark mystical, gold + crimson + black
// Output: PNG files in public/epochs/

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/home/z/my-project/public/epochs';

const EPOCHS = [
  {
    id: 'eden',
    name: 'Eden',
    prompt: 'Byzantine Orthodox icon style illustration of Eden: a dark cosmic garden with the Tree of Knowledge and Tree of Life, a golden serpent coiled around the trunk, deep black background with gold leaf halos, crimson red drapery, egg tempera on wood panel, ancient Russian icon painting style, mystical and stoic, two trees silhouette, dark sky with stars, no text',
  },
  {
    id: 'antiquity',
    name: 'Antiquity',
    prompt: 'Byzantine Orthodox icon style illustration of ancient Babel tower reaching toward heaven, dark stormy sky, golden lightning, crimson clouds, gold leaf halo behind the tower, ascetic monks at base, black and gold palette with deep red accents, egg tempera on wood, ancient Russian icon painting style, mystical and stoic, no text',
  },
  {
    id: 'prophets',
    name: 'Prophets',
    prompt: 'Byzantine Orthodox icon style illustration of a prophet descending a mountain holding stone tablets, golden halo around his head, dark desert landscape, crimson sky at dusk, gold leaf rays of divine light, ascetic figure with long beard, black and gold with crimson accents, egg tempera on wood, ancient Russian icon painting style, mystical and stoic, no text',
  },
  {
    id: 'empires',
    name: 'Empires',
    prompt: 'Byzantine Orthodox icon style illustration of a golden crown on a dark throne, scepter and orb beside it, deep crimson drapery behind, gold leaf halo surrounding the crown, dark imperial palace interior with columns, black background with gold ornaments, ascetic and solemn mood, egg tempera on wood, ancient Russian icon painting style, mystical, no text',
  },
  {
    id: 'schism',
    name: 'Schism',
    prompt: 'Byzantine Orthodox icon style illustration of a great religious schism: a golden chalice splitting in two, dark crimson裂纹 running through it, two halves pulling apart, golden halo fracturing, stormy black sky with lightning, ascetic figures on each side turning away, gold leaf accents, egg tempera on wood, ancient Russian icon painting style, mystical and stoic, no text',
  },
  {
    id: 'apocalypse',
    name: 'Apocalypse',
    prompt: 'Byzantine Orthodox icon style illustration of the apocalypse: a great beast rising from dark crimson sea, seven golden stars falling from black sky, golden moon turning to blood, ascetic saints kneeling in prayer on shore, gold leaf halos around saints, deep red and black palette with gold accents, egg tempera on wood, ancient Russian icon painting style, mystical and terrifying, no text',
  },
  {
    id: 'judgment',
    name: 'Judgment',
    prompt: 'Byzantine Orthodox icon style illustration of the Last Judgment: golden scales of justice in center, dark crimson background, a solemn judge figure silhouette with golden halo, ascetic souls rising on left and falling on right, gold leaf rays, deep black and crimson with brilliant gold, egg tempera on wood, ancient Russian icon painting style, stoic and eternal, no text',
  },
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const zai = await ZAI.create();

  for (const epoch of EPOCHS) {
    const outPath = path.join(OUT_DIR, `${epoch.id}.png`);
    if (fs.existsSync(outPath)) {
      console.log(`SKIP ${epoch.id} (already exists)`);
      continue;
    }
    console.log(`Generating ${epoch.id}...`);
    try {
      const resp = await zai.images.generations.create({
        prompt: epoch.prompt,
        size: '1024x1024',
      });
      const b64 = resp.data[0].base64;
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(outPath, buf);
      console.log(`  ✓ saved ${outPath} (${buf.length} bytes)`);
    } catch (e) {
      console.error(`  ✗ ${epoch.id}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
