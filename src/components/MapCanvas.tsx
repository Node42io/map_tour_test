import { useMemo } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Company } from '../companies'

// Branded map pin (SVG) — yellow for existing customers, off-white for prospects,
// dark stroke throughout. A selected pin gets a heavier ring. Mirrors the sales-
// hub DiscoverMap look so the two mockups read as one product.
function pin(color: string, selected: boolean): L.DivIcon {
  const ring = selected
    ? '<circle cx="18" cy="18" r="17" fill="none" stroke="#141619" stroke-width="1.5" opacity="0.35"/>'
    : ''
  const scale = selected ? 1.15 : 1
  return L.divIcon({
    className: 'n42-pin',
    html: `
      <div style="transform: scale(${scale}); transform-origin: bottom center;">
        <svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(20,22,25,0.28));">
          ${ring}
          <path d="M18 2C9.716 2 3 8.716 3 17c0 12 15 25 15 25s15-13 15-25C33 8.716 26.284 2 18 2z" fill="${color}" stroke="#141619" stroke-width="2"/>
          <circle cx="18" cy="17" r="6" fill="#141619"/>
        </svg>
      </div>`,
    iconSize: [36, 46],
    iconAnchor: [18, 44],
    tooltipAnchor: [0, -40],
  })
}

const EXISTING = '#f2ea6b'
const PROSPECT = '#f3f1eb'

export function MapCanvas({ companies, selectedId, onSelect }: { companies: Company[]; selectedId: string | null; onSelect: (c: Company) => void }) {
  // Centre roughly on southern Germany, framing all plotted sites.
  const center = useMemo<[number, number]>(() => [48.15, 10.2], [])
  return (
    <MapContainer
      center={center}
      zoom={8}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
    >
      {/* Grayscale CARTO basemap — the muted, on-brand cartography. */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
        className="n42-tiles"
      />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png" />
      {companies.map((c) => (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={pin(c.status === 'existing' ? EXISTING : PROSPECT, c.id === selectedId)}
          eventHandlers={{ click: () => onSelect(c) }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1} className="n42-tip">
            <span style={{ fontWeight: 600 }}>{c.name}</span> · {c.city}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}
