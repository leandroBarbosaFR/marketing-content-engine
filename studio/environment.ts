// Every identifier comes from SANITY_STUDIO_* variables (see .env.example). They are not secrets,
// but they are compiled into the Studio bundle, so never put tokens here.
//
// Brief section 5: two datasets in ONE project. Cross-dataset references only work inside a
// single project, and only on the Enterprise plan.
export const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'your-project-id'
// vistra.com: website content and the shared taxonomy (ICP, solution, market, topic, proof points).
export const websiteDataset = process.env.SANITY_STUDIO_WEBSITE_DATASET || 'production'
// gtm-brain: strategy, plans, budgets, messaging, briefs, campaigns, snapshots, accounts.
export const gtmDataset = process.env.SANITY_STUDIO_GTM_DATASET || 'gtm-brain'

export const WEBSITE_WORKSPACE = 'vistra-com'
export const GTM_WORKSPACE = 'gtm-brain'
