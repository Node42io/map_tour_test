import { Fragment, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { CaretDown, CaretUpDown, Target } from '@phosphor-icons/react'
import { Badge, Text } from '@node42/ui-kit'
import type { BadgeVariant } from '@node42/ui-kit'
import { loadOdiUnit, ratedByUnitId, ROLE_LABEL, stakeholderTitle } from '../data'
import type { OdiRow, OdiUnitData } from '../data'
import { levelStyle } from '../vn'

const mono: CSSProperties = { fontFamily: 'var(--font-family-mono)', fontWeight: 'var(--font-weight-medium)' }

// Scoring cut-offs — the single source of truth (mirrors the ODI matrix).
const OPP_HIGH = 12
const OPP_MODERATE = 10
const GAP_UNDERSERVED = 3
const GAP_OVERSERVED = -1

function oppVariant(opp: number): BadgeVariant {
  if (opp >= OPP_HIGH) return 'error'
  if (opp >= OPP_MODERATE) return 'warning'
  return 'neutral'
}
function oppWord(opp: number): string {
  if (opp >= OPP_HIGH) return 'high'
  if (opp >= OPP_MODERATE) return 'moderate'
  return 'low'
}
function impVariant(band: string): BadgeVariant {
  return band === 'very high' || band === 'high' ? 'success' : 'neutral'
}
function satVariant(band: string): BadgeVariant {
  if (band === 'low' || band === 'very low') return 'error'
  if (band === 'medium') return 'warning'
  return 'success'
}
function statusOf(r: OdiRow): { label: string; variant: BadgeVariant; order: number } {
  const gap = r.imp - r.sat
  if (gap >= GAP_UNDERSERVED) return { label: 'Underserved', variant: 'error', order: 3 }
  if (gap <= GAP_OVERSERVED) return { label: 'Overserved', variant: 'information', order: 1 }
  return { label: 'Served', variant: 'success', order: 2 }
}
const meanConf = (r: OdiRow) => Math.round((r.imp_conf + r.sat_conf) / 2)
const rowStk = (r: OdiRow): string => stakeholderTitle(r.stk, ROLE_LABEL[r.role])

type SortKey = 'opp' | 'status' | 'imp' | 'sat' | 'conf'

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-100)', padding: 'var(--space-300)', borderRadius: 'var(--radius-md)', background: 'var(--surface-default-default)' }}>
      <Text variant="label-s">{label}</Text>
      <span style={{ fontFamily: 'var(--font-family-sans)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-h3)', color: 'var(--text-headings)' }}>{value}</span>
      {sub ? <Text variant="b3" style={{ color: 'var(--text-description)' }}>{sub}</Text> : null}
    </div>
  )
}

function RationaleCard({ label, value, band, variant, conf, rat }: { label: string; value: number; band: string; variant: BadgeVariant; conf: number; rat: string }) {
  return (
    <div style={{ borderRadius: 'var(--radius-sm)', padding: 'var(--space-400)', background: 'var(--surface-default-default)', display: 'flex', flexDirection: 'column', gap: 'var(--space-200)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)', flexWrap: 'wrap' }}>
        <Text variant="label-s">{label}</Text>
        <span style={{ ...mono, fontSize: 'var(--font-size-b1)', color: 'var(--text-headings)' }}>{value.toFixed(1)}</span>
        <Badge variant={variant} size="xs">{band}</Badge>
        <div style={{ marginLeft: 'auto' }}>
          <Badge variant="neutral" size="xs" icon={<Target weight="regular" aria-hidden />}>{conf}%</Badge>
        </div>
      </div>
      <Text variant="b2" style={{ color: 'var(--text-body)' }}>{rat}</Text>
    </div>
  )
}

const th: CSSProperties = {
  position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface-default-default-3)',
  textAlign: 'left', padding: 'var(--space-200) var(--space-300)', whiteSpace: 'nowrap',
  fontFamily: 'var(--font-family-sans)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-b4)',
  textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-labels)', cursor: 'pointer', userSelect: 'none',
}
const td: CSSProperties = { padding: 'var(--space-300)', verticalAlign: 'top', borderTop: '1px solid var(--border-card)' }

export function NeedsPanel({ unitSlug }: { unitSlug: string }) {
  const entry = ratedByUnitId.get(unitSlug) ?? [...ratedByUnitId.values()][0]
  const slug = entry.slug
  const [loaded, setLoaded] = useState<{ slug: string; data: OdiUnitData } | null>(null)
  useEffect(() => {
    let live = true
    loadOdiUnit(slug).then((d) => { if (live) setLoaded({ slug, data: d }) })
    return () => { live = false }
  }, [slug])
  const unitData = loaded?.slug === slug ? loaded.data : null

  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'opp', dir: -1 })
  const [open, setOpen] = useState<Set<number>>(new Set())
  useEffect(() => { setOpen(new Set()) }, [slug])

  const rowsData = useMemo(() => unitData?.rows ?? [], [unitData])
  const rows = useMemo(() => {
    const val = (r: OdiRow): number => {
      if (sort.key === 'conf') return meanConf(r)
      if (sort.key === 'status') return statusOf(r).order
      return r[sort.key]
    }
    return rowsData.map((r, i) => ({ r, i })).sort((a, b) => sort.dir * (val(a.r) - val(b.r)))
  }, [rowsData, sort])

  const stats = useMemo(() => {
    let underserved = 0
    for (const r of rowsData) if (statusOf(r).label === 'Underserved') underserved++
    const topOpp = rowsData.reduce((m, r) => Math.max(m, r.opp), 0)
    return { needs: rowsData.length, stakeholders: unitData?.stakeholders.length ?? 0, underserved, topOpp }
  }, [rowsData, unitData])

  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: -1 }))
  const caret = (key: SortKey) =>
    sort.key === key ? <CaretDown size={11} style={{ transform: sort.dir === 1 ? 'rotate(180deg)' : 'none' }} /> : <CaretUpDown size={11} style={{ opacity: 0.4 }} />

  const toggleRow = (id: number) => setOpen((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  if (!unitData) return <Text variant="b2" style={{ color: 'var(--text-description)' }}>Loading needs…</Text>

  return (
    <div data-tour="needs-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-400)', width: '100%', height: '100%', minHeight: 0 }}>
      {/* Meta strip */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)', flexWrap: 'wrap' }}>
          <Badge variant="color" size="xs" style={levelStyle(unitData.unit.level)}>{unitData.unit.level}</Badge>
          <Text variant="h4" as="span">{unitData.unit.name}</Text>
        </div>
        {unitData.unit.cfj ? <Text variant="b2" style={{ color: 'var(--text-description)' }}>{unitData.unit.cfj}</Text> : null}
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'flex', gap: 'var(--space-300)', flexWrap: 'wrap' }}>
        <StatTile label="Rated needs" value={stats.needs} sub="Desired outcomes" />
        <StatTile label="Stakeholders" value={stats.stakeholders} sub="Buying-centre roles" />
        <StatTile label="Underserved" value={stats.underserved} sub="Importance ≫ satisfaction" />
        <StatTile label="Top opportunity" value={stats.topOpp.toFixed(1)} sub={oppWord(stats.topOpp)} />
      </div>

      {/* Needs table */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', background: 'var(--surface-default-default-2)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-family-sans)' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 28 }} aria-hidden />
              <th style={th} onClick={() => onSort('opp')}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Opp. {caret('opp')}</span></th>
              <th style={{ ...th, cursor: 'default' }}>Stakeholder</th>
              <th style={{ ...th, cursor: 'default' }}>Need (desired outcome)</th>
              <th style={th} onClick={() => onSort('status')}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Status {caret('status')}</span></th>
              <th style={th} onClick={() => onSort('imp')}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Imp. {caret('imp')}</span></th>
              <th style={th} onClick={() => onSort('sat')}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Sat. {caret('sat')}</span></th>
              <th style={th} onClick={() => onSort('conf')}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Conf. {caret('conf')}</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, i }) => {
              const status = statusOf(r)
              const isOpen = open.has(i)
              return (
                <Fragment key={i}>
                  <tr onClick={() => toggleRow(i)} style={{ cursor: 'pointer', background: isOpen ? 'var(--surface-default-default)' : 'transparent' }}>
                    <td style={{ ...td, textAlign: 'center', color: 'var(--icon-description)' }}>
                      <CaretDown size={13} weight="bold" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 120ms ease' }} />
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-100)' }}>
                        <Badge variant={oppVariant(r.opp)} size="xs">{oppWord(r.opp)}</Badge>
                        <span style={{ ...mono, fontSize: 'var(--font-size-b1)', color: 'var(--text-headings)' }}>{r.opp.toFixed(1)}</span>
                      </div>
                    </td>
                    <td style={{ ...td, minWidth: 160 }}>
                      <Text variant="b3" as="span">{rowStk(r)}</Text>
                      <div><Text variant="b4" as="span" style={{ color: 'var(--text-description)' }}>{r.source_job}</Text></div>
                    </td>
                    <td style={{ ...td, minWidth: 260, maxWidth: 420 }}><Text variant="b3" as="span" style={{ color: 'var(--text-body)' }}>{r.stmt}</Text></td>
                    <td style={td}><Badge variant={status.variant} size="xs">{status.label}</Badge></td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-100)' }}>
                        <Badge variant={impVariant(r.imp_band)} size="xs">{r.imp_band}</Badge>
                        <span style={{ ...mono, fontSize: 'var(--font-size-b2)', color: 'var(--text-headings)' }}>{r.imp.toFixed(1)}</span>
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-100)' }}>
                        <Badge variant={satVariant(r.sat_band)} size="xs">{r.sat_band}</Badge>
                        <span style={{ ...mono, fontSize: 'var(--font-size-b2)', color: 'var(--text-headings)' }}>{r.sat.toFixed(1)}</span>
                      </div>
                    </td>
                    <td style={td}><span style={{ ...mono, fontSize: 'var(--font-size-b2)', color: 'var(--text-body)' }}>{meanConf(r)}%</span></td>
                  </tr>
                  {isOpen ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 0, background: 'var(--surface-default-default-2)', borderTop: '1px solid var(--border-card)' }}>
                        <div style={{ padding: 'var(--space-400)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-300)' }}>
                          <RationaleCard label="Importance" value={r.imp} band={r.imp_band} variant={impVariant(r.imp_band)} conf={r.imp_conf} rat={r.imp_rat} />
                          <RationaleCard label="Satisfaction" value={r.sat} band={r.sat_band} variant={satVariant(r.sat_band)} conf={r.sat_conf} rat={r.sat_rat} />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
