// The Sanity CLI replaces process.env.SANITY_STUDIO_* references at build time, even in browser
// code; any other process.env read becomes undefined. This is not Node's `process`.
declare const process: {
  env: {
    SANITY_STUDIO_PROJECT_ID?: string
    SANITY_STUDIO_WEBSITE_DATASET?: string
    SANITY_STUDIO_GTM_DATASET?: string
    SANITY_STUDIO_APP_ID?: string
  }
}
