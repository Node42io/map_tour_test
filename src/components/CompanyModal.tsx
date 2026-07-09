import { useEffect, useState } from 'react'
import { MapPin, TreeStructure, Users, X } from '@phosphor-icons/react'
import { Badge, Button, Text, Toggle } from '@node42/ui-kit'
import type { Company } from '../companies'
import { ratedByUnitId } from '../data'
import { ValueNetworkPanel } from './ValueNetworkPanel'
import { NeedsPanel } from './NeedsPanel'

type Tab = 'vn' | 'needs'

export function CompanyModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('vn')
  // The unit the Needs tab shows — starts at the company's focus unit, updated
  // when the user clicks a unit's "needs" button inside the Value Network panel.
  const [needsSlug, setNeedsSlug] = useState<string>(() => {
    const rated = ratedByUnitId.get(company.focusUnitId)
    return rated?.slug ?? [...ratedByUnitId.values()][0].slug
  })

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const openNeeds = (slug: string) => { setNeedsSlug(slug); setTab('needs') }
  const isExisting = company.status === 'existing'

  return (
    <div
      className="n42-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`${company.name} — value network`}
    >
      <div className="n42-modal">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-400)', padding: 'var(--space-500) var(--space-600)', borderBottom: '1px solid var(--border-card)' }}>
          <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)', flexWrap: 'wrap' }}>
              <Text variant="h3" as="h1" style={{ minWidth: 0 }}>{company.name}</Text>
              <Badge variant={isExisting ? 'success' : 'neutral'} size="sm">{isExisting ? 'Existing customer' : 'Prospect'}</Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-300)', flexWrap: 'wrap', color: 'var(--text-description)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-100)' }}>
                <MapPin size={15} /><Text variant="b3" as="span" style={{ color: 'var(--text-description)' }}>{company.city}, DE</Text>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-100)' }}>
                <Users size={15} /><Text variant="b3" as="span" style={{ color: 'var(--text-description)' }}>{company.employees}</Text>
              </span>
              <Badge variant="color" size="xs">NAICS 325412</Badge>
              <Text variant="b3" as="span" style={{ color: 'var(--text-description)' }}>{company.descriptor}</Text>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-300)', flexShrink: 0 }}>
            <Toggle
              data-tour="view-toggle"
              aria-label="View"
              value={tab}
              onChange={(v) => setTab(v as Tab)}
              options={[
                { value: 'vn', icon: <TreeStructure size={16} />, label: 'Value Network' },
                { value: 'needs', icon: <Users size={16} />, label: 'Needs' },
              ]}
            />
            <Button variant="secondary-outline" size="sm" iconOnly aria-label="Close" leftIcon={<X size={16} />} onClick={onClose} />
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, padding: 'var(--space-500) var(--space-600)', overflow: 'hidden' }}>
          {tab === 'vn'
            ? <ValueNetworkPanel focusUnitId={company.focusUnitId} onNeeds={openNeeds} />
            : <NeedsPanel unitSlug={needsSlug} />}
        </div>
      </div>
    </div>
  )
}
