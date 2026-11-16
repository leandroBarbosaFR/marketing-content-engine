import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {TranslateAction} from './actions/translateAction'
import {gtmDataset, GTM_WORKSPACE, projectId, websiteDataset, WEBSITE_WORKSPACE} from './environment'
import {gtmSchemaTypes} from './schemas/gtm'
import {websiteSchemaTypes} from './schemas/website'

// Two workspaces, one per dataset (brief §5): vistra.com holds the website content and the
// shared taxonomy; gtm-brain holds planning, campaigns and results and points at the taxonomy.
export default defineConfig([
  {
    name: WEBSITE_WORKSPACE,
    title: 'vistra.com — content & taxonomy',
    basePath: `/${WEBSITE_WORKSPACE}`,
    projectId,
    dataset: websiteDataset,
    plugins: [structureTool(), visionTool()],
    schema: {types: websiteSchemaTypes},
    document: {
      actions: (previous, context) => (context.schemaType === 'contentPiece' ? [...previous, TranslateAction] : previous),
    },
  },
  {
    name: GTM_WORKSPACE,
    title: 'gtm-brain — strategy, campaigns & results',
    basePath: `/${GTM_WORKSPACE}`,
    projectId,
    dataset: gtmDataset,
    plugins: [structureTool(), visionTool()],
    schema: {types: gtmSchemaTypes},
  },
])
