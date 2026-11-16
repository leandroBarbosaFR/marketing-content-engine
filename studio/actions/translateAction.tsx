import {TranslateIcon} from '@sanity/icons/Translate'
import {useState} from 'react'
import {useClient, type DocumentActionComponent} from 'sanity'
import {WEBSITE_WORKSPACE} from '../environment'

// Phase 2, "localise (JP, CN) with Agent Actions; a person approves" (brief §4 and §5).
// Creates a translated DRAFT variant of a published English piece, linked back with variantOf and
// set to Review. Nothing is published: the reviewer publishes it (in a Content Release).
// Needs the schema deployed (`npx sanity schema deploy`) and Agent Actions on the project's plan.
const LANGUAGES = [
  {id: 'ja', title: 'Japanese'},
  {id: 'zh-hans', title: 'Chinese (Simplified)'},
]

// Words that must never be translated.
const PROTECTED_PHRASES = ['Vistra', 'VGS', 'VFS']

export const TranslateAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion: 'vX'})
  const [isTranslating, setIsTranslating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const published = props.published as {language?: string} | null

  if (props.type !== 'contentPiece' || !published || published.language !== 'en') return null

  async function translateTo(language: {id: string; title: string}) {
    setIsDialogOpen(false)
    setIsTranslating(true)
    try {
      const result = await client.agent.action.translate({
        schemaId: `_.schemas.${WEBSITE_WORKSPACE}`,
        documentId: props.id,
        targetDocument: {operation: 'create'},
        fromLanguage: {id: 'en', title: 'English'},
        toLanguage: language,
        languageFieldPath: 'language',
        protectedPhrases: PROTECTED_PHRASES,
        target: {include: ['title', 'summary', 'sections', 'faqs']},
      })
      await client
        .patch(result._id)
        .set({variantOf: {_type: 'reference', _ref: props.id}, variantKind: 'language', status: 'review'})
        .unset(['url', 'publishedAt'])
        .commit()
    } finally {
      setIsTranslating(false)
      props.onComplete()
    }
  }

  return {
    label: isTranslating ? 'Translating…' : 'Translate (draft)',
    icon: TranslateIcon,
    disabled: isTranslating,
    onHandle: () => setIsDialogOpen(true),
    dialog: isDialogOpen
      ? {
          type: 'popover',
          onClose: () => setIsDialogOpen(false),
          content: (
            <div style={{display: 'grid', gap: 8, padding: 8}}>
              {LANGUAGES.map((language) => (
                <button key={language.id} type="button" onClick={() => translateTo(language)}>
                  {language.title} draft
                </button>
              ))}
            </div>
          ),
        }
      : false,
  }
}
