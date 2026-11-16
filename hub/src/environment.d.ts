// The Sanity CLI replaces process.env.SANITY_APP_* references at build time, even in browser
// code; any other process.env read becomes undefined. This is not Node's `process`.
declare const process: {
  env: {
    SANITY_APP_ORGANIZATION_ID?: string
    SANITY_APP_ID?: string
    SANITY_APP_PROJECT_ID?: string
    SANITY_APP_WEBSITE_DATASET?: string
    SANITY_APP_GTM_DATASET?: string
    SANITY_APP_STUDIO_URL?: string
  }
}
