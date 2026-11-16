import {BarChartIcon} from '@sanity/icons/BarChart'
import {defineField, defineType} from 'sanity'
import {snapshotSubjectOptions} from '../options'
import {fourTagFields, taxonomyReference} from './taxonomyReference'

const counter = (name: string, title: string) =>
  defineField({name, title, type: 'number', group: 'metrics', validation: (rule) => rule.min(0)})

// Monthly results per asset, topic, campaign and ICP: traffic, rank, leads, MQLs, pipeline
// (brief §6). Written by the nightly Function with a deterministic _id, so re-runs replace.
export const snapshotType = defineType({
  name: 'snapshot',
  title: 'Snapshot',
  type: 'document',
  icon: BarChartIcon,
  groups: [
    {name: 'subject', title: 'Subject', default: true},
    {name: 'metrics', title: 'Metrics'},
  ],
  fields: [
    defineField({
      name: 'month',
      title: 'Month',
      type: 'date',
      group: 'subject',
      validation: (rule) =>
        rule.required().custom((month) => (typeof month === 'string' && !month.endsWith('-01') ? 'Use the first day of the month.' : true)),
    }),
    defineField({
      name: 'subjectType',
      title: 'Subject',
      type: 'string',
      group: 'subject',
      options: {list: snapshotSubjectOptions},
      validation: (rule) => rule.required(),
    }),
    taxonomyReference({
      name: 'subject',
      title: 'Content piece, topic or ICP',
      to: ['contentPiece', 'topic', 'icp'],
      group: 'subject',
      hidden: ({document}) => !['contentPiece', 'topic', 'icp'].includes(String(document?.subjectType)),
    }),
    defineField({
      name: 'campaign',
      title: 'Campaign',
      type: 'reference',
      group: 'subject',
      to: [{type: 'campaign'}],
      weak: true,
      hidden: ({document}) => document?.subjectType !== 'campaign',
    }),
    ...fourTagFields('subject'),
    counter('sessions', 'Sessions'),
    counter('conversions', 'Conversions'),
    counter('impressions', 'Impressions'),
    counter('clicks', 'Clicks'),
    defineField({name: 'position', title: 'Average position', type: 'number', group: 'metrics'}),
    counter('aiCitations', 'AI assistant citations (Peec AI)'),
    counter('leads', 'Leads'),
    counter('mqls', 'MQLs'),
    counter('aiAssistantMqls', 'MQLs from AI assistants'),
    counter('opportunities', 'Opportunities'),
    counter('pipeline', 'Pipeline (GBP)'),
    counter('spend', 'Paid spend (GBP)'),
    defineField({
      name: 'mqlsBySource',
      title: 'MQLs by source',
      type: 'array',
      group: 'metrics',
      hidden: ({document}) => document?.subjectType !== 'all',
      of: [
        {
          type: 'object',
          name: 'sourceCount',
          fields: [
            defineField({name: 'source', title: 'Source', type: 'string'}),
            defineField({name: 'mqls', title: 'MQLs', type: 'number'}),
          ],
          preview: {select: {title: 'source', subtitle: 'mqls'}},
        },
      ],
    }),
    defineField({name: 'syncedAt', title: 'Synced at', type: 'datetime', group: 'subject', readOnly: true}),
  ],
  preview: {select: {month: 'month', subjectType: 'subjectType'}, prepare: ({month, subjectType}) => ({title: `${subjectType} · ${String(month ?? '').slice(0, 7)}`})},
})
