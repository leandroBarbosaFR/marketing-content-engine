import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineField, defineType} from 'sanity'
import {contentStatusOptions, formatOptions, languageOptions, stageOptions, variantKindOptions} from '../options'

const HUBSPOT_FORM_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// A guide, article, tool, case study or video (brief §4 and §6). Structured, not page-shaped:
// sections with question-led headings, FAQs and proof points, so the same piece feeds the website,
// email, sales kits and AI answers. Every piece has a topic, ICP, solution, market and stage, an
// owner, a review date and a conversion point.
export const contentPieceType = defineType({
  name: 'contentPiece',
  title: 'Content piece',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'plan', title: 'Plan', default: true},
    {name: 'content', title: 'Content'},
    {name: 'publish', title: 'Publish & convert'},
  ],
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', group: 'plan', validation: (rule) => rule.required()}),
    defineField({
      name: 'format',
      title: 'Type',
      type: 'string',
      group: 'plan',
      options: {list: formatOptions},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Lifecycle',
      type: 'string',
      group: 'plan',
      options: {list: contentStatusOptions},
      initialValue: 'backlog',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'topic', title: 'Topic', type: 'reference', group: 'plan', to: [{type: 'topic'}], validation: (rule) => rule.required()}),
    defineField({name: 'icp', title: 'ICP', type: 'reference', group: 'plan', to: [{type: 'icp'}], validation: (rule) => rule.required()}),
    defineField({name: 'solution', title: 'Solution', type: 'reference', group: 'plan', to: [{type: 'solution'}], validation: (rule) => rule.required()}),
    defineField({name: 'market', title: 'Market', type: 'reference', group: 'plan', to: [{type: 'market'}], validation: (rule) => rule.required()}),
    defineField({
      name: 'stage',
      title: 'Journey stage',
      type: 'string',
      group: 'plan',
      options: {list: stageOptions, layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'owner', title: 'Owner', type: 'string', group: 'plan', validation: (rule) => rule.required()}),
    defineField({
      name: 'reviewDate',
      title: 'Review date',
      type: 'date',
      group: 'plan',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'plannedDate', title: 'Planned publish date', type: 'date', group: 'plan', description: 'Editorial calendar.'}),
    defineField({
      name: 'summary',
      title: 'Answer in two sentences',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Built for AI answers: the direct answer, quotable on its own.',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          name: 'section',
          fields: [
            defineField({
              name: 'heading',
              title: 'Question-led heading',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({name: 'body', title: 'Body', type: 'array', of: [{type: 'block'}]}),
          ],
          preview: {select: {title: 'heading'}},
        },
      ],
    }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      group: 'content',
      description: 'Rendered with FAQ schema markup on vistra.com.',
      of: [
        {
          type: 'object',
          name: 'faq',
          fields: [
            defineField({name: 'question', title: 'Question', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'question'}},
        },
      ],
    }),
    defineField({
      name: 'proofPoints',
      title: 'Proof points',
      type: 'array',
      group: 'content',
      of: [{type: 'reference', to: [{type: 'proofPoint'}]}],
    }),
    defineField({
      name: 'conversion',
      title: 'Conversion point',
      type: 'object',
      group: 'publish',
      description: 'Guides and tools get their own form so MQLs can be counted per asset.',
      fields: [
        defineField({name: 'ctaLabel', title: 'Call to action', type: 'string'}),
        defineField({
          name: 'hubspotFormId',
          title: 'HubSpot form ID',
          type: 'string',
          validation: (rule) => rule.regex(HUBSPOT_FORM_ID, {name: 'HubSpot form GUID'}),
        }),
      ],
      validation: (rule) =>
        rule.custom((conversion, context) => {
          const piece = context.document as {format?: string; status?: string} | undefined
          const needsForm = piece?.format === 'guide' || piece?.format === 'tool'
          const formId = (conversion as {hubspotFormId?: string} | undefined)?.hubspotFormId
          return needsForm && piece?.status === 'published' && !formId
            ? 'Guides and tools need their own HubSpot form before publishing.'
            : true
        }),
    }),
    defineField({name: 'url', title: 'URL', type: 'url', group: 'publish'}),
    defineField({name: 'publishedAt', title: 'Published', type: 'date', group: 'publish'}),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      group: 'publish',
      options: {list: languageOptions},
      initialValue: 'en',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'variantOf',
      title: 'Variant of',
      type: 'reference',
      group: 'publish',
      to: [{type: 'contentPiece'}],
      description: 'One asset, many uses: a language, market or format version of another piece.',
    }),
    defineField({
      name: 'variantKind',
      title: 'Variant kind',
      type: 'string',
      group: 'publish',
      options: {list: variantKindOptions},
      hidden: ({document}) => !document?.variantOf,
    }),
  ],
  preview: {select: {title: 'title', format: 'format', status: 'status', language: 'language'}, prepare: ({title, format, status, language}) => ({title, subtitle: [format, status, language].filter(Boolean).join(' · ')})},
})
