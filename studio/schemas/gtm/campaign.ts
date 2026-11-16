import {RocketIcon} from '@sanity/icons/Rocket'
import {defineField, defineType} from 'sanity'
import {campaignStageOptions, channelOptions, tacticKindOptions} from '../options'
import {taxonomyReference, taxonomyReferences} from './taxonomyReference'

// programme, icp, solution, market, channels, budget, dates, stage, content used, HubSpot campaign
// ID, UTM (brief §6). The name is the ad-platform name: Funnel joins on it (or on the platform ID).
export const campaignType = defineType({
  name: 'campaign',
  title: 'Campaign',
  type: 'document',
  icon: RocketIcon,
  groups: [
    {name: 'plan', title: 'Plan', default: true},
    {name: 'distribution', title: 'Content & tactics'},
    {name: 'ids', title: 'IDs'},
  ],
  fields: [
    defineField({name: 'title', title: 'Campaign name', type: 'string', group: 'plan', validation: (rule) => rule.required()}),
    defineField({name: 'programme', title: 'Programme', type: 'reference', group: 'plan', to: [{type: 'programme'}]}),
    defineField({
      name: 'brand',
      title: 'Brand campaign (all ICPs)',
      type: 'boolean',
      group: 'plan',
      initialValue: false,
      description: 'Brand search serves every ICP and has no single ICP tag.',
    }),
    taxonomyReference({name: 'icp', title: 'ICP', to: ['icp'], group: 'plan', hidden: ({document}) => Boolean(document?.brand)}),
    taxonomyReference({name: 'solution', title: 'Solution', to: ['solution'], group: 'plan'}),
    taxonomyReference({name: 'market', title: 'Market', to: ['market'], group: 'plan'}),
    taxonomyReference({name: 'topic', title: 'Topic', to: ['topic'], group: 'plan'}),
    defineField({name: 'channels', title: 'Channels', type: 'array', group: 'plan', of: [{type: 'string'}], options: {list: channelOptions}}),
    defineField({name: 'budget', title: 'Budget (GBP)', type: 'number', group: 'plan', validation: (rule) => rule.min(0)}),
    defineField({name: 'startDate', title: 'Start', type: 'date', group: 'plan'}),
    defineField({name: 'endDate', title: 'End', type: 'date', group: 'plan'}),
    defineField({
      name: 'stage',
      title: 'Stage',
      type: 'string',
      group: 'plan',
      options: {list: campaignStageOptions, layout: 'radio', direction: 'horizontal'},
      initialValue: 'planned',
    }),
    defineField({name: 'owner', title: 'Owner', type: 'string', group: 'plan'}),
    taxonomyReferences({name: 'contentUsed', title: 'Content used', to: ['contentPiece'], group: 'distribution'}),
    defineField({
      name: 'tactics',
      title: 'Tactics / asset use',
      type: 'array',
      group: 'distribution',
      description: 'Which asset runs where.',
      of: [
        {
          type: 'object',
          name: 'tactic',
          fields: [
            defineField({name: 'kind', title: 'Kind', type: 'string', options: {list: tacticKindOptions}, validation: (rule) => rule.required()}),
            defineField({name: 'name', title: 'Name', type: 'string'}),
            taxonomyReference({name: 'asset', title: 'Uses', to: ['contentPiece']}),
            defineField({name: 'url', title: 'Link', type: 'url'}),
          ],
          preview: {select: {title: 'name', subtitle: 'kind'}},
        },
      ],
    }),
    defineField({name: 'hubspotCampaignId', title: 'HubSpot campaign ID', type: 'string', group: 'ids'}),
    defineField({
      name: 'utm',
      title: 'UTM campaign',
      type: 'string',
      group: 'ids',
      validation: (rule) => rule.regex(/^[a-z0-9_-]+$/, {name: 'lowercase utm_campaign'}),
    }),
    defineField({name: 'platformCampaignId', title: 'Ad platform campaign ID', type: 'string', group: 'ids'}),
  ],
  preview: {select: {title: 'title', subtitle: 'stage'}},
})
