// Identifiers for the one Sanity project that holds both datasets (brief §5). They are not
// secrets, but the app bundle is public to anyone who can load it: never add a token here.
export const PROJECT_ID = process.env.SANITY_APP_PROJECT_ID || 'your-project-id'
export const WEBSITE_DATASET = process.env.SANITY_APP_WEBSITE_DATASET || 'production'
export const GTM_DATASET = process.env.SANITY_APP_GTM_DATASET || 'gtm-brain'
export const STUDIO_URL = (process.env.SANITY_APP_STUDIO_URL || '').replace(/\/$/, '')

// Must match the workspace names in studio/environment.ts.
export const WEBSITE_WORKSPACE = 'vistra-com'
export const GTM_WORKSPACE = 'gtm-brain'

export function studioEditUrl(workspace: string, id: string, type: string): string | undefined {
  if (!STUDIO_URL) return undefined
  return `${STUDIO_URL}/${workspace}/intent/edit/id=${encodeURIComponent(id)};type=${encodeURIComponent(type)}/`
}

// A reference from gtm-brain to the vistra.com taxonomy, the shape the Studio writes.
export function taxonomyRef(id: string) {
  return {_type: 'crossDatasetReference', _ref: id, _dataset: WEBSITE_DATASET, _projectId: PROJECT_ID, _weak: true}
}
