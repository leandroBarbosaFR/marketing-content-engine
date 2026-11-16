import {defineArrayMember, defineField, type Rule} from 'sanity'
import {websiteDataset, WEBSITE_WORKSPACE} from '../../environment'

// Cross-dataset references from gtm-brain to the shared taxonomy in the vistra.com dataset
// (brief §5). Same project only, and Enterprise only: on other plans the Content Lake refuses
// to store them. Weak, so a website editor is never blocked from deleting a tag.
type TaxonomyType = 'icp' | 'solution' | 'market' | 'topic' | 'proofPoint' | 'contentPiece'

const previews: Record<TaxonomyType, {title: string; preview: {select: Record<string, string>}}> = {
  icp: {title: 'ICP', preview: {select: {title: 'title', subtitle: 'clientPhrase'}}},
  solution: {title: 'Solution', preview: {select: {title: 'title', subtitle: 'businessUnit'}}},
  market: {title: 'Market', preview: {select: {title: 'title', subtitle: 'countryCode'}}},
  topic: {title: 'Topic', preview: {select: {title: 'title', subtitle: 'kind'}}},
  proofPoint: {title: 'Proof point', preview: {select: {title: 'title', subtitle: 'expiresAt'}}},
  contentPiece: {title: 'Content piece', preview: {select: {title: 'title', subtitle: 'status'}}},
}

function crossDatasetTarget(types: TaxonomyType[]) {
  return {
    type: 'crossDatasetReference' as const,
    dataset: websiteDataset,
    weak: true,
    to: types.map((type) => ({type, ...previews[type]})),
    studioUrl: ({id, type}: {id: string; type?: string}) =>
      type ? `/${WEBSITE_WORKSPACE}/intent/edit/id=${encodeURIComponent(id)};type=${type}/` : null,
  }
}

export function taxonomyReference({
  name,
  title,
  to,
  required = false,
  group,
  hidden,
}: {
  name: string
  title: string
  to: TaxonomyType[]
  required?: boolean
  group?: string
  hidden?: (context: {parent?: Record<string, unknown>; document?: Record<string, unknown>}) => boolean
}) {
  return defineField({
    name,
    title,
    group,
    hidden,
    ...crossDatasetTarget(to),
    validation: required ? (rule: Rule) => rule.required() : undefined,
  })
}

export function taxonomyReferences({name, title, to, group}: {name: string; title: string; to: TaxonomyType[]; group?: string}) {
  return defineField({
    name,
    title,
    type: 'array',
    group,
    of: [defineArrayMember({...crossDatasetTarget(to), name: `${name}Item`})],
  })
}

// The four tags every content piece, campaign and snapshot carries (brief §6).
export function fourTagFields(group?: string) {
  return [
    taxonomyReference({name: 'icp', title: 'ICP', to: ['icp'], group}),
    taxonomyReference({name: 'solution', title: 'Solution', to: ['solution'], group}),
    taxonomyReference({name: 'market', title: 'Market', to: ['market'], group}),
    taxonomyReference({name: 'topic', title: 'Topic', to: ['topic'], group}),
  ]
}
