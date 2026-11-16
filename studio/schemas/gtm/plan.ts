import {ProjectsIcon} from '@sanity/icons/Projects'
import {defineField, defineType} from 'sanity'
import {businessUnitOptions, planMetricOptions} from '../options'

export const targetsField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [
      {
        type: 'object',
        name: 'target',
        fields: [
          defineField({name: 'metric', title: 'Metric', type: 'string', options: {list: planMetricOptions}, validation: (rule) => rule.required()}),
          defineField({name: 'value', title: 'Target', type: 'number', validation: (rule) => rule.required().min(0)}),
        ],
        preview: {select: {title: 'metric', subtitle: 'value'}},
      },
    ],
  })

// Annual plan: FY goals and budget by BU (brief §3).
export const planType = defineType({
  name: 'plan',
  title: 'Annual plan',
  type: 'document',
  icon: ProjectsIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'fiscalYear',
      title: 'Fiscal year',
      type: 'string',
      validation: (rule) => rule.required().regex(/^FY\d{2}$/, {name: 'FY27'}),
    }),
    targetsField('goals', 'Goals'),
    defineField({
      name: 'budgets',
      title: 'Budget by BU (GBP)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'budget',
          fields: [
            defineField({name: 'businessUnit', title: 'BU', type: 'string', options: {list: businessUnitOptions}, validation: (rule) => rule.required()}),
            defineField({name: 'amount', title: 'Amount (GBP)', type: 'number', validation: (rule) => rule.required().min(0)}),
          ],
          preview: {select: {title: 'businessUnit', subtitle: 'amount'}},
        },
      ],
    }),
  ],
})
