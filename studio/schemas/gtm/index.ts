import {accountType} from './account'
import {briefType} from './brief'
import {campaignType} from './campaign'
import {competitorType} from './competitor'
import {messagingPillarType} from './messagingPillar'
import {planType} from './plan'
import {programmeType} from './programme'
import {snapshotType} from './snapshot'

// gtm-brain dataset (brief §5): strategy, plans, budgets, messaging, briefs, campaigns,
// performance snapshots and accounts. Points at the taxonomy with cross-dataset references.
export const gtmSchemaTypes = [
  planType,
  programmeType,
  messagingPillarType,
  competitorType,
  briefType,
  campaignType,
  snapshotType,
  accountType,
]
