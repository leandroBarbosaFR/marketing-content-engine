import {TargetIcon} from '@sanity/icons/Target'
import {defineField, defineType} from 'sanity'

// Positioning, pricing signals, win/loss themes (brief §3).
export const competitorType = defineType({
  name: 'competitor',
  title: 'Competitor',
  type: 'document',
  icon: TargetIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'positioning', title: 'Positioning', type: 'text', rows: 3}),
    defineField({name: 'pricingSignals', title: 'Pricing signals', type: 'text', rows: 2}),
    defineField({name: 'winThemes', title: 'Win themes', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'lossThemes', title: 'Loss themes', type: 'array', of: [{type: 'string'}]}),
  ],
})
