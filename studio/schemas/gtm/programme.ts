import {StackIcon} from '@sanity/icons/Stack'
import {defineField, defineType} from 'sanity'
import {businessUnitOptions} from '../options'
import {targetsField} from './plan'
import {taxonomyReference, taxonomyReferences} from './taxonomyReference'

// One programme per BU × ICP × market, with budget and targets (brief §3).
export const programmeType = defineType({
  name: 'programme',
  title: 'Programme',
  type: 'document',
  icon: StackIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'plan', title: 'Annual plan', type: 'reference', to: [{type: 'plan'}], validation: (rule) => rule.required()}),
    defineField({
      name: 'businessUnit',
      title: 'BU',
      type: 'string',
      options: {list: businessUnitOptions, layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    taxonomyReference({name: 'icp', title: 'ICP', to: ['icp'], required: true}),
    taxonomyReference({name: 'market', title: 'Market', to: ['market'], required: true}),
    taxonomyReferences({name: 'solutions', title: 'Solutions', to: ['solution']}),
    defineField({
      name: 'messaging',
      title: 'Messaging pillars',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'messagingPillar'}]}],
    }),
    defineField({name: 'budget', title: 'Budget (GBP)', type: 'number', validation: (rule) => rule.min(0)}),
    targetsField('targets', 'Targets'),
    defineField({name: 'owner', title: 'Owner', type: 'string'}),
  ],
})
