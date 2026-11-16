import {CommentIcon} from '@sanity/icons/Comment'
import {defineField, defineType} from 'sanity'
import {taxonomyReference} from './taxonomyReference'

// Core message per ICP × solution, with approved claims and banned claims (brief §3).
export const messagingPillarType = defineType({
  name: 'messagingPillar',
  title: 'Messaging pillar',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    taxonomyReference({name: 'icp', title: 'ICP', to: ['icp'], required: true}),
    taxonomyReference({name: 'solution', title: 'Solution', to: ['solution'], required: true}),
    taxonomyReference({name: 'market', title: 'Market', to: ['market']}),
    defineField({name: 'coreMessage', title: 'Core message', type: 'text', rows: 3, validation: (rule) => rule.required()}),
    defineField({
      name: 'approvedClaims',
      title: 'Approved claims',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'approvedClaim',
          fields: [
            defineField({name: 'claim', title: 'Claim', type: 'string', validation: (rule) => rule.required()}),
            taxonomyReference({name: 'proofPoint', title: 'Backed by', to: ['proofPoint']}),
          ],
          preview: {select: {title: 'claim'}},
        },
      ],
    }),
    defineField({
      name: 'bannedClaims',
      title: 'Banned claims',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'bannedClaim',
          fields: [
            defineField({name: 'claim', title: 'Do not say', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'reason', title: 'Why', type: 'string'}),
          ],
          preview: {select: {title: 'claim', subtitle: 'reason'}},
        },
      ],
    }),
  ],
})
