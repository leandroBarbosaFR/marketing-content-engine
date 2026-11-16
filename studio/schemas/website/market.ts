import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {defineField, defineType} from 'sanity'
import {languageOptions} from '../options'

// Country or region, language, regulation (e.g. ECCTA), priority ICPs, local proof (brief §3).
export const marketType = defineType({
  name: 'market',
  title: 'Market',
  type: 'document',
  icon: EarthGlobeIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'kind',
      title: 'Country or region',
      type: 'string',
      options: {
        list: [
          {title: 'Country', value: 'country'},
          {title: 'Region', value: 'region'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'countryCode',
      title: 'Country code',
      type: 'string',
      hidden: ({parent}) => parent?.kind !== 'country',
      validation: (rule) => rule.regex(/^[A-Z]{2}$/, {name: 'ISO 3166-1 alpha-2'}),
    }),
    defineField({
      name: 'languages',
      title: 'Languages',
      type: 'array',
      of: [{type: 'string'}],
      options: {list: languageOptions},
    }),
    defineField({
      name: 'regulations',
      title: 'Regulation',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'regulation',
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'summary', title: 'What it means for clients', type: 'text', rows: 2}),
          ],
        },
      ],
    }),
    defineField({
      name: 'priorityIcps',
      title: 'Priority ICPs',
      type: 'array',
      description: 'Local teams choose emphasis, not definitions.',
      of: [{type: 'reference', to: [{type: 'icp'}]}],
    }),
    defineField({
      name: 'localProof',
      title: 'Local proof',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'proofPoint'}]}],
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'countryCode'}},
})
