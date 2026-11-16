import {UsersIcon} from '@sanity/icons/Users'
import {defineField, defineType} from 'sanity'
import {archetypeOptions} from '../options'

// The five Simon-Kucher archetypes: situation, need, client phrase, triggers, pathway (brief §3).
// Lives in the vistra.com dataset so pages, guides and the hub all point at the same ICP.
export const icpType = defineType({
  name: 'icp',
  title: 'ICP',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'archetype',
      title: 'Archetype',
      type: 'string',
      options: {list: archetypeOptions},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'situation',
      title: 'Situation',
      type: 'text',
      rows: 2,
      description: 'What the client is fundamentally trying to achieve. Sales match on this.',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'need', title: 'Primary need', type: 'text', rows: 2}),
    defineField({name: 'clientPhrase', title: 'Client phrase', type: 'string'}),
    defineField({
      name: 'triggers',
      title: 'Buying triggers',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'pathway',
      title: 'Vistra pathway',
      type: 'array',
      description: 'Steps in order.',
      of: [{type: 'string'}],
    }),
    defineField({name: 'order', title: 'Sort order', type: 'number'}),
  ],
  orderings: [{title: 'Sort order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'clientPhrase'}},
})
