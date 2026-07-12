import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const OUT = '/home/z/my-project/public/epochs';
const PROMPTS: Record<string, string> = {
  antiquity: 'Byzantine Orthodox icon: dark Babel tower reaching to stormy sky, golden lightning, crimson clouds, gold halo, ascetic monks at base, black gold crimson, egg tempera, no text',
  prophets: 'Byzantine Orthodox icon: prophet descending mountain with stone tablets, golden halo, dark desert, crimson dusk sky, gold divine light rays, ascetic bearded figure, egg tempera, no text',
  empires: 'Byzantine Orthodox icon: golden crown on dark throne, scepter and orb, crimson drapery, gold halo around crown, dark imperial palace, black gold, egg tempera, no text',
  schism: 'Byzantine Orthodox icon: golden chalice splitting in two, crimson裂纹, fracturing halo, stormy black sky, two ascetic figures turning away, gold leaf, egg tempera, no text',
  apocalypse: 'Byzantine Orthodox icon: beast rising from crimson sea, seven golden stars falling, blood moon, kneeling saints with halos, deep red black gold, egg tempera, no text',
  judgment: 'Byzantine Orthodox icon: Last Judgment, golden scales of justice, crimson background, judge silhouette with halo, souls rising and falling, gold rays, egg tempera, no text',
};

async function main() {
  const zai = await ZAI.create();
  for (const [id, prompt] of Object.entries(PROMPTS)) {
    const out = `${OUT}/${id}.png`;
    if (fs.existsSync(out)) { console.log(`SKIP ${id}`); continue; }
    console.log(`Generating ${id}...`);
    try {
      const r = await zai.images.generations.create({ prompt, size: '1024x1024' });
      fs.writeFileSync(out, Buffer.from(r.data[0].base64, 'base64'));
      console.log(`  ✓ ${id} saved`);
    } catch (e) {
      console.error(`  ✗ ${id}:`, e instanceof Error ? e.message : e);
    }
  }
}
main();
