import {
  createDocument,
  editDocument,
  publishDocument,
  useApplyDocumentActions,
  useQuery,
} from '@sanity/sdk-react'
import {useCallback, useMemo} from 'react'
import {GTM_DATASET, PROJECT_ID, taxonomyRef, WEBSITE_DATASET} from './config'
import {buildModel, type EngineModel} from './engine/model'
import {GTM_QUERY, WEBSITE_QUERY, type GtmDocument, type WebsiteDocument} from './engine/types'

// GROQ cannot join across datasets, so the hub reads both whole (they are small) and the engine
// joins the cross-dataset references in code. vistra.com is read as published, the website's
// truth; gtm-brain includes drafts so a brief created from a gap shows up straight away.
export function useEngineModel(): EngineModel {
  const {data: website} = useQuery<WebsiteDocument[]>({
    query: WEBSITE_QUERY,
    projectId: PROJECT_ID,
    dataset: WEBSITE_DATASET,
    perspective: 'published',
  })
  const {data: gtm} = useQuery<GtmDocument[]>({
    query: GTM_QUERY,
    projectId: PROJECT_ID,
    dataset: GTM_DATASET,
    perspective: 'drafts',
  })
  return useMemo(() => buildModel(website ?? [], gtm ?? []), [website, gtm])
}

export type IcpChoice = {kind: 'icp'; icpId: string} | {kind: 'brand'}

// The two writes the brief asks the hub to make: tag a campaign with its ICP (the register), and
// turn a coverage gap into a brief (Content). Both publish at once, as an editor would.
export function useEngineActions() {
  const apply = useApplyDocumentActions()

  const setCampaignIcp = useCallback(
    async (campaignId: string, choice: IcpChoice) => {
      const handle = {documentId: campaignId, documentType: 'campaign', projectId: PROJECT_ID, dataset: GTM_DATASET}
      const patch =
        choice.kind === 'brand'
          ? {set: {brand: true}, unset: ['icp']}
          : {set: {brand: false, icp: taxonomyRef(choice.icpId)}}
      await apply([editDocument(handle, patch), publishDocument(handle)])
    },
    [apply],
  )

  const createBrief = useCallback(
    async ({icpId, stage, title, deadline}: {icpId: string; stage: string; title: string; deadline?: string}) => {
      const handle = {documentId: crypto.randomUUID(), documentType: 'brief', projectId: PROJECT_ID, dataset: GTM_DATASET}
      await apply([
        createDocument(handle, {title, icp: taxonomyRef(icpId), stage, status: 'requested', deadline}),
        publishDocument(handle),
      ])
    },
    [apply],
  )

  return {setCampaignIcp, createBrief}
}
