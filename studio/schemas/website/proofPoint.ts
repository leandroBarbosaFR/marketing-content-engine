import {StarIcon} from '@sanity/icons/Star'
import {defineField, defineType} from 'sanity'
import {proofKindOptions} from '../options'

// Stat, quote or case study with source, expiry date and allowed markets (brief §3).
export const proofPointType = defineType({
  name: 'proofPoint',
  title: 'Proof point',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {list: proofKindOptions, layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'statement', title: 'Statement', type: 'text', rows: 3, validation: (rule) => rule.required()}),
    defineField({name: 'source', title: 'Source', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'expiresAt', title: 'Expiry date', type: 'date', validation: (rule) => rule.required()}),
    defineField({
      name: 'allowedMarkets',
      title: 'Allowed markets',
      type: 'array',
      description: 'Empty means every market.',
      of: [{type: 'reference', to: [{type: 'market'}]}],
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'expiresAt'}},
})
