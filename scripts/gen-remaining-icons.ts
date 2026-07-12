// Generate remaining epoch icons with retry logic
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const OUT = '/home/z/my-project/public/epochs';
const IDS = ['antiquity', 'prophets', 'empires', 'schism', 'apocalypse', 'judgment'];

const PROMPTS: Record<string, string> = {
  antiquity: 'Byzantine Orthodox icon painting, ancient ziggurat tower reaching toward stormy golden sky, lightning bolts, crimson clouds, ascetic monks at base in prayer, gold leaf halos, deep black background with gold and crimson, egg tempera on wood, mystical, no text',
  prophets: 'Byzantine Orthodox icon painting, old prophet with long white beard descending rocky mountain, holding stone tablets, golden halo around head, dark desert landscape, crimson dusk sky, rays of divine gold light from above, ascetic figure, egg tempera on wood, no text',
  empires: 'Byzantine Orthodox icon painting, ornate golden crown on dark wooden throne, scepter and orb beside it, deep crimson drapery behind, golden halo surrounding crown, dark palace interior with marble columns, black and gold with crimson, egg tempera on wood, solemn, no text',
  schism: 'Byzantine Orthodox icon painting, golden chalice splitting in two with crimson cracks running through, fracturing golden halo, stormy black sky with lightning, two groups of ascetic monks turning away from each other, gold leaf accents, egg tempera on wood, mystical, no text',
  apocalypse: 'Byzantine Orthodox icon painting, great beast with seven heads rising from crimson sea, seven golden stars falling from black sky, blood-red moon, three kneeling saints with golden halos on shore, deep red and black with gold, egg tempera on wood, terrifying, no text',
  judgment: 'Byzantine Orthodox icon painting, golden scales of justice in center, dark crimson background, silhouette of judge figure with golden halo, souls rising on left in gold light and falling on right into darkness, brilliant gold rays, black and crimson with gold, egg tempera on wood, eternal, no text',
};

async function tryGenerate(zai: any, prompt: string, timeoutMs = 90000): Promise<Buffer | null> {
  try {
    const r = await Promise.race([
      zai.images.generations.create({ prompt, size: '1024x1024' }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    return Buffer.from(r.data[0].base64, 'base64');
  } catch (e) {
    return null;
  }
}

async function main() {
  const zai = await ZAI.create();
  for (const id of IDS) {
    const out = `${OUT}/${id}.png`;
    if (fs.existsSync(out)) { console.log(`SKIP ${id}`); continue; }

    console.log(`Generating ${id}...`);
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`  attempt ${attempt}...`);
      const buf = await tryGenerate(zai, PROMPTS[id]);
      if (buf && buf.length > 1000) {
        fs.writeFileSync(out, buf);
        console.log(`  ✓ ${id} saved (${buf.length} bytes)`);
        success = true;
        break;
      }
      // Wait before retry
      await new Promise(r => setTimeout(r, 5000));
    }
    if (!success) {
      console.log(`  ✗ ${id} failed after 3 attempts`);
    }
  }
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
