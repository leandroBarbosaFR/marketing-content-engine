import {defineCliConfig} from 'sanity/cli'

// The Marketing Hub is a Sanity App SDK app. It belongs to the organization that owns the project
// holding both datasets (see ../README.md). Set the variables in .env (see .env.example).
export default defineCliConfig({
  app: {
    organizationId: process.env.SANITY_APP_ORGANIZATION_ID || 'your-organization-id',
    entry: './src/App.tsx',
    title: 'Marketing Hub',
  },
  deployment: {
    appId: process.env.SANITY_APP_ID || undefined,
  },
})
