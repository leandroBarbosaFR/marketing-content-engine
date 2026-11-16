// Writes the synthetic seed as two NDJSON files, one per dataset, ready for `sanity dataset import`.
//   SANITY_PROJECT_ID=abc123 npm run seed
// The project ID goes into every cross-dataset reference, so it must be the real target project.
import {mkdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {generateSeed} from '../seed/generate.ts'

const projectId = process.env.SANITY_PROJECT_ID
if (!projectId) {
  console.error('Set SANITY_PROJECT_ID to the project that holds both datasets.')
  process.exit(1)
}
const websiteDataset = process.env.SANITY_WEBSITE_DATASET || 'production'
const gtmDataset = process.env.SANITY_GTM_DATASET || 'gtm-brain'

const seed = generateSeed({projectId, websiteDataset})
const outputDirectory = join(import.meta.dirname, '../seed/out')
mkdirSync(outputDirectory, {recursive: true})
const toNdjson = (documents: unknown[]) => `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`
writeFileSync(join(outputDirectory, `${websiteDataset}.ndjson`), toNdjson(seed.website))
writeFileSync(join(outputDirectory, `${gtmDataset}.ndjson`), toNdjson(seed.gtm))
console.log(`Wrote ${seed.website.length} documents for ${websiteDataset} and ${seed.gtm.length} for ${gtmDataset} in seed/out/.`)
console.log('Synthetic data: import into a sandbox project only, never the live vistra.com project.')
console.log('Import the website dataset first, then gtm-brain:')
console.log(`  cd studio && npx sanity dataset import ../seed/out/${websiteDataset}.ndjson ${websiteDataset} --replace`)
console.log(`  cd studio && npx sanity dataset import ../seed/out/${gtmDataset}.ndjson ${gtmDataset} --replace`)
