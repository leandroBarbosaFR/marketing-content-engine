import {TagIcon} from '@sanity/icons/Tag'
import {defineField, defineType} from 'sanity'
import {stageOptions} from '../options'

// Pillar or cluster, parent, target queries, ICP, solution, journey stage (brief §6).
export const topicType = defineType({
  name: 'topic',
  title: 'Topic',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'kind',
      title: 'Pillar or cluster',
      type: 'string',
      options: {
        list: [
          {title: 'Pillar', value: 'pillar'},
          {title: 'Cluster', value: 'cluster'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Parent pillar',
      type: 'reference',
      to: [{type: 'topic'}],
      options: {filter: 'kind == "pillar"'},
      hidden: ({parent}) => parent?.kind !== 'cluster',
    }),
    defineField({
      name: 'targetQueries',
      title: 'Target queries',
      type: 'array',
      description: 'Search queries this topic should rank for. Search Console rows map to the topic through them.',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({name: 'icp', title: 'ICP', type: 'reference', to: [{type: 'icp'}]}),
    defineField({name: 'solution', title: 'Solution', type: 'reference', to: [{type: 'solution'}]}),
    defineField({name: 'stage', title: 'Journey stage', type: 'string', options: {list: stageOptions}}),
  ],
  preview: {select: {title: 'title', subtitle: 'kind'}},
})
