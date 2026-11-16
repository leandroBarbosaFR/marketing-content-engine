import {CubeIcon} from '@sanity/icons/Cube'
import {defineField, defineType} from 'sanity'
import {businessUnitOptions} from '../options'

// Payroll, entity management, tax & accounting, fund admin, market entry: value prop, proof
// points, pricing guidance (brief §3).
export const solutionType = defineType({
  name: 'solution',
  title: 'Solution',
  type: 'document',
  icon: CubeIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'businessUnit',
      title: 'Business unit',
      type: 'string',
      options: {list: businessUnitOptions, layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'valueProposition', title: 'Value proposition', type: 'text', rows: 3}),
    defineField({
      name: 'proofPoints',
      title: 'Proof points',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'proofPoint'}]}],
    }),
    defineField({
      name: 'pricingGuidance',
      title: 'Pricing guidance',
      type: 'text',
      rows: 3,
      description: 'Internal. Never published on the site.',
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'businessUnit'}},
})
