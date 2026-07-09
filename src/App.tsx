import { useState } from 'react'
import { ArrowRight, Buildings, MapPin } from '@phosphor-icons/react'
import { Badge, Text } from '@node42/ui-kit'
import { COMPANIES } from './companies'
import type { Company } from './companies'
import { market } from './data'
import { MapCanvas } from './components/MapCanvas'
import { CompanyModal } from './components/CompanyModal'
import { Tour } from './components/Tour'

function CompanyRow({ company, selected, onClick }: { company: Company; selected: boolean; onClick: () => void }) {
  const isExisting = company.status === 'existing'
  return (
    <button
      type="button"
      onClick={onClick}
      className="n42-co-row"
      data-selected={selected}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)', minWidth: 0 }}>
        <span
          aria-hidden
          style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: isExisting ? '#f2ea6b' : 'var(--white)', boxShadow: 'inset 0 0 0 1.5px #141619' }}
        />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, textAlign: 'left' }}>
          <Text variant="b2" weight="medium" as="span" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company.name}</Text>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-description)' }}>
            <MapPin size={12} /><Text variant="b4" as="span" style={{ color: 'var(--text-description)' }}>{company.city}</Text>
          </span>
        </span>
      </span>
      <ArrowRight size={15} className="n42-co-arrow" />
    </button>
  )
}

export default function App() {
  const [selected, setSelected] = useState<Company | null>(null)
  const existing = COMPANIES.filter((c) => c.status === 'existing').length

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Map background */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapCanvas companies={COMPANIES} selectedId={selected?.id ?? null} onSelect={setSelected} />
      </div>

      {/* Floating customer sidebar */}
      <aside className="n42-sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)', padding: 'var(--space-500)', borderBottom: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: 'var(--surface-widget-icon)' }}>
              <Buildings size={20} weight="regular" style={{ color: 'var(--text-headings)' }} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text variant="b1" weight="medium" as="span">Customer Map</Text>
              <Text variant="b4" as="span" style={{ color: 'var(--text-description)' }}>Sterile Fill-Finish · Southern Germany</Text>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-200)', flexWrap: 'wrap' }}>
            <Badge variant="color" size="xs">NAICS {market.naics_code}</Badge>
            <Badge variant="neutral" size="xs">{COMPANIES.length} accounts</Badge>
            <Badge variant="success" size="xs">{existing} existing</Badge>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 'var(--space-200)' }}>
          {COMPANIES.map((c) => (
            <CompanyRow key={c.id} company={c} selected={selected?.id === c.id} onClick={() => setSelected(c)} />
          ))}
        </div>
        <div style={{ padding: 'var(--space-300) var(--space-500)', borderTop: '1px solid var(--border-card)' }}>
          <Text variant="b4" as="span" style={{ color: 'var(--text-description)' }}>
            Select an account to open its value network &amp; needs.
          </Text>
        </div>
      </aside>

      {/* Legend */}
      <div className="n42-legend">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f2ea6b', boxShadow: 'inset 0 0 0 1.5px #141619' }} />
          <Text variant="b4" as="span">Existing customer</Text>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--white)', boxShadow: 'inset 0 0 0 1.5px #141619' }} />
          <Text variant="b4" as="span">Prospect</Text>
        </span>
      </div>

      {/* Overlay modal */}
      {selected ? <CompanyModal company={selected} onClose={() => setSelected(null)} /> : null}

      {/* Guided tour */}
      <Tour />
    </div>
  )
}
