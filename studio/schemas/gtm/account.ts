import {CaseIcon} from '@sanity/icons/Case'
import {defineField, defineType} from 'sanity'
import {taxonomyReference} from './taxonomyReference'

// Salesforce and Demandbase IDs, ICP, scores (brief §6 and §7). Company-level only: no contacts.
// Written by the phase 4 sync; the scores use the section 7 formulas.
export const accountType = defineType({
  name: 'account',
  title: 'Account',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({name: 'title', title: 'Company', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'salesforceId',
      title: 'Salesforce account ID',
      type: 'string',
      validation: (rule) => rule.regex(/^001[A-Za-z0-9]{12}([A-Za-z0-9]{3})?$/, {name: 'Salesforce account ID'}),
    }),
    defineField({name: 'demandbaseId', title: 'Demandbase ID', type: 'string'}),
    taxonomyReference({name: 'icp', title: 'ICP', to: ['icp']}),
    defineField({
      name: 'inputs',
      title: 'Scoring inputs',
      type: 'object',
      fields: [
        defineField({name: 'revenueUsd', title: 'Revenue (USD)', type: 'number'}),
        defineField({name: 'globalCountries', title: 'Countries the client operates in', type: 'number'}),
        defineField({name: 'vistraCountries', title: 'Countries Vistra serves', type: 'number'}),
        defineField({name: 'productGroups', title: 'Product groups Vistra serves', type: 'number'}),
      ],
    }),
    defineField({
      name: 'rightToWin',
      title: 'Right to win',
      type: 'object',
      fields: ['capability', 'geographic', 'proposition', 'relationship', 'economic'].map((lens) =>
        defineField({name: lens, title: `${lens[0].toUpperCase()}${lens.slice(1)} fit`, type: 'boolean', initialValue: false}),
      ),
    }),
    defineField({
      name: 'scores',
      title: 'Scores',
      type: 'object',
      readOnly: true,
      fields: [
        defineField({name: 'potential', title: 'Potential (0–100)', type: 'number'}),
        defineField({name: 'complexity', title: 'Complexity (0–100)', type: 'number'}),
        defineField({name: 'rightToWin', title: 'Right to win (0–5)', type: 'number'}),
        defineField({name: 'quadrant', title: 'Quadrant', type: 'string'}),
      ],
    }),
  ],
})
