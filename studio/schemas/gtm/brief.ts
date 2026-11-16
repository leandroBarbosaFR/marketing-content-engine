import {ComposeIcon} from '@sanity/icons/Compose'
import {defineField, defineType} from 'sanity'
import {briefStatusOptions, formatOptions, stageOptions} from '../options'
import {taxonomyReference, taxonomyReferences} from './taxonomyReference'

// Topic, ICP, messaging pillar, proof points, format, deadline, status (brief §6). Written by the
// content lead, or created from a gap in the hub's coverage grid.
export const briefType = defineType({
  name: 'brief',
  title: 'Brief',
  type: 'document',
  icon: ComposeIcon,
  fields: [
    defineField({name: 'title', title: 'Working title', type: 'string', validation: (rule) => rule.required()}),
    taxonomyReference({name: 'topic', title: 'Topic', to: ['topic'], required: true}),
    taxonomyReference({name: 'icp', title: 'ICP', to: ['icp'], required: true}),
    defineField({name: 'stage', title: 'Journey stage', type: 'string', options: {list: stageOptions}}),
    defineField({name: 'messagingPillar', title: 'Messaging pillar', type: 'reference', to: [{type: 'messagingPillar'}]}),
    taxonomyReferences({name: 'proofPoints', title: 'Proof points', to: ['proofPoint']}),
    defineField({name: 'format', title: 'Format', type: 'string', options: {list: formatOptions}, validation: (rule) => rule.required()}),
    defineField({name: 'deadline', title: 'Deadline', type: 'date', validation: (rule) => rule.required()}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: briefStatusOptions, layout: 'radio', direction: 'horizontal'},
      initialValue: 'requested',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'notes', title: 'Angle and must-cover points', type: 'text', rows: 4}),
    defineField({name: 'owner', title: 'Writer', type: 'string'}),
    taxonomyReference({name: 'deliverable', title: 'Delivered as', to: ['contentPiece']}),
  ],
  preview: {select: {title: 'title', subtitle: 'deadline'}},
})
