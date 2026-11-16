# Marketing and Content Engine on Sanity

A build of the developer brief **"Marketing and Content Engine on Sanity"** (Abdi, 15 October 2026),
with the client scoring from Simon-Kucher's **"Vistra ICP development"** (October 2026). It covers
what the brief asks for and nothing beyond it. All data in this repository is synthetic.

> [!IMPORTANT]
> **The brief's data model needs the Sanity Enterprise plan.** The taxonomy (ICPs, solutions,
> markets, topics) lives in the vistra.com dataset, and everything in `gtm-brain` points at it
> with **cross-dataset references**. Sanity offers those on Enterprise only, and only between
> datasets in the **same project**. So `gtm-brain` must be created inside the vistra.com project,
> not in a project of its own. On the Growth plan the Studio cannot save these references. In
> that case the taxonomy has to be copied into `gtm-brain` instead, which changes the brief's
> §5 design and needs Abdi's agreement first.

## What is in the repository

```
studio/                 Sanity Studio with two workspaces in one project
  schemas/website/      vistra.com dataset: icp, solution, market, topic, proofPoint, contentPiece
  schemas/gtm/          gtm-brain dataset: plan, programme, messagingPillar, competitor, brief,
                        campaign, snapshot, account (taxonomy fields are cross-dataset references)
  actions/              "Translate": Agent Actions JP / CN draft variant of a content piece
hub/                    Marketing Hub, a Sanity App SDK app (the brief's screens)
  src/engine/           Pure functions behind every screen: joins, roll-ups, scoring, tagging
  src/tabs/             One file per tab
functions/nightly-sync/ Scheduled Function: source systems → monthly snapshots in gtm-brain
seed/                   Deterministic synthetic seed for both datasets
tests/                  Engine, seed, scoring and tagging tests (vitest)
sanity.blueprint.ts     Deploys the Function
```

## The brief, item by item

| Brief | Built | Where |
|---|---|---|
| §3 Strategy as data | `icp` (five Simon-Kucher archetypes with situation, need, client phrase, triggers and service pathway), `solution`, `market`, `proofPoint` (with expiry and allowed markets), `messagingPillar` (approved and banned claims), `competitor`, `plan`, `programme` | `studio/schemas/` |
| §4 Topics, stages, formats | `topic` (pillar / cluster, target queries), buying stages Aware / Consider / Decide, `contentPiece` formats | `studio/schemas/website/` |
| §4 Content rules | Question-led sections, FAQs, proof points, owner, review date, HubSpot form per guide or tool, URL, language variants | `contentPiece.ts` |
| §4 / §5 Localise JP and CN with Agent Actions; a person approves | "Translate" document action: creates a draft variant set to Review, linked with `variantOf`. Nothing is published automatically | `studio/actions/translateAction.tsx` |
| §5 Two datasets | vistra.com (`production`) holds the taxonomy and content; `gtm-brain` holds strategy, campaigns, results and accounts | `studio/sanity.config.ts` |
| §6 The same four tags on everything | ICP, solution, market and topic on content pieces, briefs, campaigns and snapshots | `gtm/taxonomyReference.ts` |
| §6 `brief`, `campaign`, `snapshot`, `account` | All four. Campaigns carry programme, channels, budget, stage, content used, tactics, HubSpot ID, UTM and platform ID. Snapshots are month × subject with the deterministic ID `snapshot-YYYY-MM-<type>-<id>` | `studio/schemas/gtm/` |
| §7 Scoring | Potential = 0.7·R + 0.3·G, complexity = 0.5·C + 0.5·P, thresholds 36 / 20, right to win 0–5 (credible from 3), quadrants, commercial stance and next-best actions | `hub/src/engine/scoring.ts` |
| §8 Prototype screens | Overview, ICPs, Campaigns (register with filters, CSV export, ICP proposed from the campaign name and applied in one click), Analytics, Orchestration, ICP scorer, Sanity setup | `hub/src/tabs/` |
| §8 Two new tabs | **Strategy**: plan, programme roll-ups against targets, messaging by ICP × solution, proof points (expired proof still live is flagged), competitors. **Content**: coverage grid by ICP × stage with "Create brief" on gaps, inventory with the four tags, editorial calendar, topic results | `hub/src/tabs/StrategyTab.tsx`, `ContentTab.tsx` |
| §9 Phase 3 nightly sync | Funnel.io (paid), GA4, Search Console, HubSpot and Peec AI rows → snapshots per content piece, topic, campaign, ICP and site total; GBP conversion; reconciliation against a 98% match target. No source is connected (see below) | `functions/nightly-sync/` |

GROQ cannot join across datasets, so the hub loads both datasets (they are small) and joins the
cross-dataset references in `hub/src/engine/model.ts`. Every screen is a pure function of the two
datasets, which is what the tests check.

## Where I had to interpret

- **Orchestration and Sanity setup tabs.** The prototype (`icp-campaign-hub.html`) was never shared,
  so these two are built from the brief's text and labelled "Interpretation" in the app.
  Orchestration shows which asset runs where (ICP × channel, asset reuse by tactic, campaigns by
  stage). Sanity setup shows document counts per dataset, whether every cross-dataset reference
  resolves, and the last sync. The other tabs follow the screenshots on page 10 of the brief.
- **Site totals.** The Overview's "new leads / MQLs, all sources" and "MQLs by source" need numbers
  that belong to no single asset or campaign. They are stored as snapshots with the extra subject
  type `all`.
- **Money is in GBP**, as in the brief.

## Not code: Sanity features to switch on

These are product configuration rather than code, so they are not in this repository:

- **Content Releases**: gated publishing of reviewed variants and briefs (brief §5).
- **Media Library**: shared assets across both datasets.
- **Canvas**: drafting from a brief.
- **Agent Actions**: must be enabled on the plan for "Translate". The schema must also be deployed (`npx sanity schema deploy`).
- **Phase 5 agents** (Content Agent audits, Context MCP): they read the same schemas and the four tags; nothing extra is needed in the model.
- **Roles**: who can publish to vistra.com and who can only work in `gtm-brain`.

## Running it

Requirements: Node 22, a Sanity project on Enterprise with both datasets, and the organization ID.

```bash
npm ci && (cd studio && npm ci) && (cd hub && npm ci)
cp studio/.env.example studio/.env      # project ID and dataset names
cp hub/.env.example hub/.env            # organization, project, datasets, Studio URL
```

- Studio: `cd studio && npm run dev`, then `npx sanity schema deploy` and `npm run deploy`.
- Hub: `cd hub && npm run dev` (opens in the Sanity Dashboard), then `npm run deploy` and put the printed app ID in `SANITY_APP_ID`.
- CORS: none needed for the hub, which runs inside the Dashboard.

### Synthetic seed (sandbox projects only)

```bash
SANITY_PROJECT_ID=<sandbox project> npm run seed     # writes seed/out/*.ndjson
cd studio
npx sanity dataset import ../seed/out/production.ndjson production --replace
npx sanity dataset import ../seed/out/gtm-brain.ndjson gtm-brain --replace
```

Import the website dataset first, so the cross-dataset references in `gtm-brain` have targets.
**Never import the seed into the live vistra.com project.** It holds 63 vistra.com documents
(5 ICPs, 5 solutions, 8 markets, 17 topics, 8 proof points, 20 content pieces) and 256 `gtm-brain`
documents: plan, 5 programmes, 7 pillars, 3 competitors, 4 briefs, 21 campaigns, 195 snapshots
for July–October 2026 and 20 scored accounts. Accounts, competitors and the plan are marked
"(synthetic)", campaign names start with `syn_`, and every URL is on example.com.

The seed contains the patterns the brief describes, so each screen has something to show:

- one ICP takes most of the paid spend, and two ICPs are effectively unfunded;
- a third of paid spend is brand search, which no single ICP owns;
- two campaigns are untagged and get an ICP proposed;
- content gaps at Consider and Decide;
- in September, leads go up while MQLs go down;
- an expired proof point is still used by live content.

### Nightly sync

The Function is off until you turn it on, and it never writes while `SYNTHETIC_ONLY` is not `false`:

```bash
npx sanity functions env add nightly-sync SYNC_PROJECT_ID <project>
npx sanity functions env add nightly-sync SYNC_GBP_RATES "USD=0.79,EUR=0.85"
# one set of credentials per source, see functions/nightly-sync/lib/sourceAdapters.ts
npx sanity functions env add nightly-sync SYNTHETIC_ONLY false
npx sanity functions env add nightly-sync SYNC_ENABLED true
npx sanity blueprints deploy
```

Each adapter in `functions/nightly-sync/lib/sourceAdapters.ts` still needs its API client. That
waits on IT Security's approval of each connection (brief §10) and on the brief's open questions
about how GA4, Search Console and Peec AI are reached (directly or through Funnel). Everything after
the adapters (matching, roll-ups, IDs, reconciliation) is built and tested. Check
`npx sanity functions logs nightly-sync`: every source should match 98% or more.

## Tests and CI

`npm test` at the root runs 75 tests:

- **Scoring**: the check values in brief §7.
- **Tagging**: campaign name → ICP proposal.
- **Every screen** on the seed: headline, unfunded ICPs, coverage gaps, the September anomaly, programme roll-ups, expired proof, draft handling.
- **Seed integrity**: references resolve, cross-dataset references are well formed, each dataset holds only its own types, site totals cover everything attributed. The hub's two GROQ queries run against the seed with groq-js.
- **Sync mapping and guardrails.**

CI (`.github/workflows/ci.yml`) runs those tests and the type checks, plus lint, schema validation and builds for the Studio and the hub.

## Estimate and blockers (phases 1–3)

My estimate for taking this from synthetic to live, one developer:

| Phase | State in this repo | Remaining work | Estimate |
|---|---|---|---|
| 1. Model and tagging | Built | Create `gtm-brain` in the vistra.com project; import the real taxonomy; tag existing content and the campaign register | 1–2 weeks |
| 2. Hub and content engine | Built on synthetic data | Review against the real prototype; deploy; set roles; switch on Agent Actions and Content Releases | 1 week |
| 3. Nightly sync | Mapping built, adapters stubbed | One API client per source and a reconciliation pass on real data | 2–3 weeks after access is approved |

**Blockers:**

1. **Plan.** The Enterprise plan is needed for cross-dataset references (see the top of this file).
2. **Access approvals.** IT Security must approve each source connection, and TDA must classify the account data (company records only, no contacts).
3. **HubSpot tracking.** Forms must send the page URL and a form ID per asset, and contacts must be linked to Salesforce accounts.
4. **The prototype file** (`icp-campaign-hub.html`), to check the Orchestration and Sanity setup tabs.

## Security

- **No secrets in the browser.** Only identifiers go in `SANITY_APP_*` and `SANITY_STUDIO_*` variables, because those end up in the browser bundle. Source credentials live in Function environment variables.
- **Synthetic data only.** The repository holds synthetic data, and the sync refuses to write while `SYNTHETIC_ONLY` is set.
- **Hub permissions.** The hub writes only two things: an ICP tag on a campaign, and a new brief. Both go through the signed-in user's own Sanity permissions.
