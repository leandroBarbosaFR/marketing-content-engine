// Sanity Functions for the Marketing and Content Engine. Deploy from the repository root:
//   npx sanity blueprints plan     (preview)
//   npx sanity blueprints deploy
// Settings and secrets are Function environment variables:
//   npx sanity functions env add nightly-sync <NAME> <value>
// See functions/nightly-sync/index.ts for the variables it reads.
import {defineBlueprint, defineScheduledFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    // Nightly sync (brief §6): source systems → monthly snapshots in gtm-brain. Off until
    // SYNC_ENABLED=true and a source has credentials; never writes while SYNTHETIC_ONLY.
    defineScheduledFunction({
      name: 'nightly-sync',
      src: './functions/nightly-sync',
      timeout: 900,
      event: {expression: '0 2 * * *'},
      timezone: 'UTC',
    }),
  ],
})
