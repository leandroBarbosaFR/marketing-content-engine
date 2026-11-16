import {contentPieceType} from './contentPiece'
import {icpType} from './icp'
import {marketType} from './market'
import {proofPointType} from './proofPoint'
import {solutionType} from './solution'
import {topicType} from './topic'

// vistra.com dataset (brief §5): website content plus the shared taxonomy. In production these
// types join AnalogFolk's content model (open question 1).
export const websiteSchemaTypes = [icpType, solutionType, marketType, topicType, proofPointType, contentPieceType]
