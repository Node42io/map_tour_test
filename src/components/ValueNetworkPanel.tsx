import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  ArrowElbowDownRight, ArrowRight, ArrowSquareOut, CaretDown, Crown, Cube, Eye,
  Heart, Megaphone, ShoppingCart, Target, Wrench,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Badge, Button, Divider, InfoCard, SearchBar, Text, TreeView } from '@node42/ui-kit'
import type { TreeNode } from '@node42/ui-kit'
import {
  loadOdiUnit, productsByUnitId, ratedByUnitId, ROLE_LABEL, ROLE_ORDER, stakeholderTitle,
} from '../data'
import type { OdiUnitData, VNNode } from '../data'
import {
  allNodeIds, defaultExpandedIds, filterTree, findNodePath, levelStyle, nodeById,
  productIds, trailIds, valueTree,
} from '../vn'

// ── Tree-row marker: a cube on a product-matched unit, a dot on each ancestor ──
function treeMarker(id: string): ReactNode {
  if (productIds.has(id)) {
    return (
      <span style={{ position: 'relative', display: 'inline-flex', width: 16, height: 16, flexShrink: 0 }} aria-hidden>
        <Cube size={16} weight="fill" style={{ position: 'absolute', inset: 0, color: 'var(--primary-400)' }} />
        <Cube size={16} weight="regular" style={{ position: 'absolute', inset: 0, color: 'var(--secondary-450)' }} />
      </span>
    )
  }
  if (trailIds.has(id)) {
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-600)', flexShrink: 0, boxShadow: '0 0 0 2px var(--surface-default-default)' }} />
  }
  return null
}
// Decorate the plain-name tree with product/trail markers at render time.
function decorate(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((n) => {
    const marker = treeMarker(n.id)
    const text: ReactNode = marker ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-100)', minWidth: 0 }}>
        {marker}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nodeById.get(n.id)?.name}</span>
      </span>
    ) : n.text
    return { ...n, text, children: n.children ? decorate(n.children) : undefined }
  })
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)', width: '100%' }}>
      <Text variant="label-s">{label}</Text>
      {children}
    </div>
  )
}

// ── Path schema: root→selected chain, indented, each row selectable ──
function LevelSchema({ path, selectedId, onSelect }: { path: TreeNode[]; selectedId: string; onSelect: (n: TreeNode) => void }) {
  if (!path.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)', width: '100%' }}>
      {path.map((node, i) => {
        const isSelected = node.id === selectedId
        return (
          <button
            type="button" key={node.id} onClick={() => onSelect(node)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-200)', minWidth: 0, width: '100%', margin: 0,
              padding: 'var(--space-100)', paddingLeft: `calc(var(--space-100) + var(--space-400) * ${i})`,
              border: 0, borderRadius: 'var(--radius-xs)',
              background: isSelected ? 'var(--surface-default-default-2)' : 'transparent',
              cursor: 'pointer', textAlign: 'left', font: 'inherit',
            }}
          >
            {i > 0 ? <ArrowElbowDownRight size={14} style={{ flexShrink: 0, color: 'var(--text-labels)' }} /> : null}
            <Badge variant="color" size="xs" style={levelStyle(node.badge)}>{node.badge}</Badge>
            <Text variant="b2" weight={isSelected ? 'medium' : undefined} as="span"
              style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isSelected ? 'var(--text-headings)' : 'var(--text-body)' }}>
              {nodeById.get(node.id)?.name ?? node.text}
            </Text>
          </button>
        )
      })}
    </div>
  )
}

// ── Buying centre (stakeholders + jobs), lazy-loaded per rated unit ──
const escoUrl = (esco: string) => `https://esco.ec.europa.eu/en/search-occupations?text=${encodeURIComponent(esco)}`
type JobKind = 'cfj' | 'core' | 'emotional' | 'status'
type StakeholderJobs = Record<JobKind, string[]>
const emptyJobs: StakeholderJobs = { cfj: [], core: [], emotional: [], status: [] }

function buildJobs(rows: OdiUnitData['rows']): Record<string, StakeholderJobs> {
  const acc: Record<string, { core: string[]; emotional: string[]; status: string[]; seen: Set<string> }> = {}
  for (const r of rows) {
    const a = (acc[stakeholderTitle(r.stk, ROLE_LABEL[r.role])] ??= { core: [], emotional: [], status: [], seen: new Set() })
    const key = `${r.job_type}::${r.source_job}`
    if (a.seen.has(key)) continue
    a.seen.add(key)
    if (r.job_type === 'core') a.core.push(r.source_job)
    else if (r.job_type === 'emotional') a.emotional.push(r.source_job)
    else if (r.job_type === 'status') a.status.push(r.source_job)
  }
  const out: Record<string, StakeholderJobs> = {}
  for (const [stk, a] of Object.entries(acc)) out[stk] = { cfj: [], core: a.core, emotional: a.emotional, status: a.status }
  return out
}

const JOB_KINDS: { key: JobKind; label: string; short: string; icon: Icon; color: string }[] = [
  { key: 'cfj', label: 'Core Functional Job', short: 'CFJ', icon: Target, color: 'var(--tertiary-default)' },
  { key: 'core', label: 'Core Jobs', short: 'core', icon: Wrench, color: 'var(--info-default)' },
  { key: 'emotional', label: 'Emotional Jobs', short: 'emo', icon: Heart, color: 'var(--danger-400)' },
  { key: 'status', label: 'Status Job', short: 'status', icon: Crown, color: 'var(--warning-default)' },
]
const ROLE_META: Record<string, { label: string; icon: Icon; desc: string }> = {
  job_executor: { label: 'Job Executor', icon: Wrench, desc: 'Operates the system day to day.' },
  job_overseer: { label: 'Job Overseer', icon: Eye, desc: 'Governs safety and service quality.' },
  purchase_influencer: { label: 'Purchase Influencer', icon: Megaphone, desc: 'Shapes specification and vendor choice.' },
  purchase_executor: { label: 'Purchase Executor', icon: ShoppingCart, desc: 'Holds budget and signs the purchase.' },
}

function StakeholderCard({ name, esco, jobs }: { name: string; esco: string | null; jobs: StakeholderJobs }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-default-default)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)', padding: 'var(--space-200) var(--space-300)', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)', minWidth: 0 }}>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)', flex: 1, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', font: 'inherit', textAlign: 'left', minWidth: 0 }}>
            <CaretDown size={14} weight="bold" style={{ flexShrink: 0, color: 'var(--icon-description)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 120ms ease' }} />
            <Text variant="b2" weight="medium" as="span" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Text>
          </button>
          {esco ? (
            <a href={escoUrl(esco)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              title={`Open ESCO ${esco}`} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none', color: 'inherit' }}>
              <Badge variant="color" size="xs">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-100)' }}>ESCO {esco}<ArrowSquareOut size={11} /></span>
              </Badge>
            </a>
          ) : null}
        </div>
        {!open && JOB_KINDS.some((k) => jobs[k.key].length) ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)', flexWrap: 'wrap', paddingLeft: 'calc(14px + var(--space-200))' }}>
            {JOB_KINDS.map((k) => jobs[k.key].length ? (
              <span key={k.key} title={k.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-100)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: k.color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-b4)', color: 'var(--text-description)' }}>{jobs[k.key].length} {k.short}</span>
              </span>
            ) : null)}
          </span>
        ) : null}
      </div>
      {open ? (
        <div style={{ padding: '0 var(--space-300) var(--space-300)', display: 'flex', flexDirection: 'column', gap: 'var(--space-300)' }}>
          {JOB_KINDS.map((k) => {
            const items = jobs[k.key]
            if (!items.length) return null
            const Ico = k.icon
            return (
              <div key={k.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)' }}>
                  <Ico size={13} style={{ color: k.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-family-sans)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-b4)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-labels)' }}>{k.label}</span>
                  {items.length > 1 ? <Badge variant="neutral" size="xs">{items.length}</Badge> : null}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-50)', paddingLeft: 'calc(13px + var(--space-100))' }}>
                  {items.map((j) => <Text key={j} variant="b3" as="span" style={{ color: 'var(--text-body)' }}>{j}</Text>)}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function StakeholderSection({ unit }: { unit: OdiUnitData }) {
  const jobsByStakeholder = useMemo(() => buildJobs(unit.rows), [unit])
  const groups = useMemo(
    () => ROLE_ORDER.map((role) => ({
      role, label: ROLE_META[role].label, icon: ROLE_META[role].icon, desc: ROLE_META[role].desc,
      roles: unit.stakeholders.filter((s) => s.role === role).map((s) => {
        const name = stakeholderTitle(s.title, ROLE_LABEL[role])
        const jobs = jobsByStakeholder[name] ?? emptyJobs
        return { name, esco: s.esco_code, jobs: { ...jobs, cfj: s.cfj_for_stakeholder ? [s.cfj_for_stakeholder] : [] } }
      }),
    })).filter((g) => g.roles.length),
    [unit, jobsByStakeholder],
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)', width: '100%' }}>
      {groups.map((g) => {
        const RoleIcon = g.icon
        return (
          <InfoCard key={g.role} style={{ minWidth: 0 }} titleVariant="b2"
            title={
              <span style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)', minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)' }}>
                  <RoleIcon size={14} /><Text variant="b3" weight="medium" as="span">{g.label}</Text>
                </span>
                <Text variant="b3" as="span" style={{ color: 'var(--text-description)' }}>{g.desc}</Text>
              </span>
            }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-200)', width: '100%', minWidth: 0 }}>
              {g.roles.map((role, i) => <StakeholderCard key={`${role.name}-${i}`} name={role.name} esco={role.esco} jobs={role.jobs} />)}
            </div>
          </InfoCard>
        )
      })}
    </div>
  )
}

const isProductLevel = (level: string): boolean => {
  const m = /\d+/.exec(level)
  return m ? parseInt(m[0], 10) <= 5 : false
}
const unspscSearchUrl = (name: string) => `https://www.google.com/search?q=${encodeURIComponent(`UNSPSC code ${name}`)}`

// ── Detail panel for the selected tree node ──
function MarketDetail({ node, path, onSelect, onNeeds }: { node: TreeNode; path: TreeNode[]; onSelect: (n: TreeNode) => void; onNeeds: (slug: string) => void }) {
  const data = nodeById.get(node.id) as VNNode | undefined
  const rated = data ? ratedByUnitId.get(data.id) : undefined
  const matchedProducts = data ? productsByUnitId.get(data.id) : undefined
  const ratedSlug = rated?.slug
  const [loaded, setLoaded] = useState<{ slug: string; data: OdiUnitData } | null>(null)
  useEffect(() => {
    if (!ratedSlug) return
    let live = true
    loadOdiUnit(ratedSlug).then((d) => { if (live) setLoaded({ slug: ratedSlug, data: d }) })
    return () => { live = false }
  }, [ratedSlug])
  const odiUnit = ratedSlug && loaded?.slug === ratedSlug ? loaded.data : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)', flex: '1 1 0', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-300)', minWidth: 0, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)', flex: '1 1 auto', minWidth: 0 }}>
          <Badge variant="color" size="xs" style={{ ...levelStyle(node.badge), flexShrink: 0 }}>{node.badge}</Badge>
          <Text variant="h4" as="p" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{data?.name ?? node.text}</Text>
        </div>
        {rated ? (
          <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => onNeeds(rated.slug)} style={{ flexShrink: 0 }}>
            {rated.needs} needs
          </Button>
        ) : null}
      </div>
      <Divider />
      <Section label="Path"><LevelSchema path={path} selectedId={node.id} onSelect={onSelect} /></Section>
      {data?.cfj ? (
        <><Divider /><Section label="Core Functional Job"><Text variant="b2">{data.cfj}</Text></Section></>
      ) : null}
      {data && isProductLevel(data.level) ? (
        <>
          <Divider />
          <Section label={matchedProducts?.length ? 'Matched Products' : 'UNSPSC'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-200)', width: '100%', minWidth: 0 }}>
              {matchedProducts?.length ? matchedProducts.map((p) => (
                <div key={p} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)', alignItems: 'flex-start', padding: 'var(--space-300)', borderRadius: 'var(--radius-md)', background: 'var(--surface-default-default-2)', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)' }}>
                    <Cube size={16} /><Text variant="b1" weight="medium" as="span">{p}</Text>
                  </div>
                  <Text variant="b3" style={{ color: 'var(--text-description)' }}>Waldner Process and Automation Solutions</Text>
                </div>
              )) : (
                <Button variant="secondary-outline" size="sm" rightIcon={<ArrowSquareOut size={14} />} onClick={() => window.open(unspscSearchUrl(data.name), '_blank', 'noopener')}>
                  Find UNSPSC code
                </Button>
              )}
            </div>
          </Section>
        </>
      ) : null}
      {rated ? (
        <>
          <Divider />
          <Section label="Buying Centre">
            {odiUnit ? <StakeholderSection unit={odiUnit} /> : <Text variant="b3" style={{ color: 'var(--text-description)' }}>Loading buying centre…</Text>}
          </Section>
        </>
      ) : null}
    </div>
  )
}

// ── The embeddable Value Network panel ──
export function ValueNetworkPanel({ focusUnitId, onNeeds }: { focusUnitId?: string; onNeeds: (slug: string) => void }) {
  const initial = useMemo(() => {
    if (focusUnitId) {
      const p = findNodePath(valueTree, focusUnitId)
      if (p.length) return p[p.length - 1]
    }
    return valueTree[0]
  }, [focusUnitId])
  const [selected, setSelected] = useState<TreeNode>(initial)
  const [query, setQuery] = useState('')
  useEffect(() => setSelected(initial), [initial])

  const path = useMemo(() => findNodePath(valueTree, selected.id), [selected.id])
  const filtered = useMemo(() => decorate(filterTree(valueTree, query)), [query])
  // Expand every ancestor of the focused node on first open so it's visible.
  const focusExpanded = useMemo(() => (focusUnitId ? findNodePath(valueTree, focusUnitId).map((n) => n.id) : defaultExpandedIds), [focusUnitId])

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 'var(--space-400)', width: '100%', height: '100%', minHeight: 0 }}>
      <div data-tour="vn-tree" style={{ flex: '0 0 340px', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 'var(--space-200)', overflow: 'hidden', minHeight: 0 }}>
        <SearchBar size="sm" placeholder="Search value network…" aria-label="Search the value network" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingRight: 'var(--space-100)' }}>
          <TreeView
            key={query || focusUnitId || 'root'}
            nodes={filtered}
            defaultExpandedIds={query ? allNodeIds(filtered) : focusExpanded}
            highlightedIds={new Set(path.map((n) => n.id))}
            selectedId={selected.id}
            onSelect={setSelected}
            style={{ overflow: 'hidden' }}
          />
        </div>
      </div>
      <Divider orientation="vertical" />
      <div data-tour="vn-detail" style={{ flex: '1 1 0', minWidth: 0, overflow: 'auto', paddingRight: 'var(--space-200)' }}>
        <MarketDetail node={selected} path={path} onSelect={setSelected} onNeeds={onNeeds} />
      </div>
    </div>
  )
}
