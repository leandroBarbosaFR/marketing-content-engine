import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'your-project-id',
    dataset: process.env.SANITY_STUDIO_GTM_DATASET || 'gtm-brain',
  },
  deployment: {
    appId: process.env.SANITY_STUDIO_APP_ID || undefined,
    autoUpdates: true,
  },
})
