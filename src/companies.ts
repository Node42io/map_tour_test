// Customer map layer.
//
// The companies plotted on the map are sterile fill-finish / pharmaceutical
// manufacturers in southern Germany (NAICS 325412) — the customer base for a
// vendor like Waldner Process and Automation Solutions. Every company opens into
// the SAME Sterile Fill-Finish value network (the shared market spine exported
// from the graph); `focusUnitId` is the value-network unit that customer's
// engagement centres on, so the modal opens pre-focused on what matters to them.

export interface Company {
  id: string
  name: string
  city: string
  lat: number
  lng: number
  /** Existing customer vs. prospect — drives the pin colour on the map. */
  status: 'existing' | 'prospect'
  descriptor: string
  employees: string
  /** Value-network unit id the modal opens focused on (an ODI-rated unit). */
  focusUnitId: string
}

export const COMPANIES: Company[] = [
  {
    id: 'vetter',
    name: 'Vetter Pharma',
    city: 'Ravensburg',
    lat: 47.7817,
    lng: 9.6127,
    status: 'existing',
    descriptor: 'CDMO — aseptic filling of prefilled syringes & cartridges',
    employees: '~6,000',
    focusUnitId: 'aseptic-filling-machine',
  },
  {
    id: 'rentschler',
    name: 'Rentschler Biopharma',
    city: 'Laupheim',
    lat: 48.2247,
    lng: 9.879,
    status: 'existing',
    descriptor: 'Biologics CDMO — sterile drug substance & fill-finish',
    employees: '~1,300',
    focusUnitId: 'isolator-system',
  },
  {
    id: 'boehringer',
    name: 'Boehringer Ingelheim',
    city: 'Biberach an der Riß',
    lat: 48.1,
    lng: 9.7833,
    status: 'prospect',
    descriptor: 'Pharma — large-molecule sterile manufacturing site',
    employees: '~6,700 (site)',
    focusUnitId: 'cleanroom-hvac-airflow-system',
  },
  {
    id: 'sandoz',
    name: 'Sandoz / Hexal',
    city: 'Holzkirchen',
    lat: 47.8842,
    lng: 11.7017,
    status: 'existing',
    descriptor: 'Generics & biosimilars — injectable finished dose',
    employees: '~2,900',
    focusUnitId: 'stoppering-machine',
  },
  {
    id: 'daiichi',
    name: 'Daiichi Sankyo',
    city: 'Pfaffenhofen a.d. Ilm',
    lat: 48.5311,
    lng: 11.5083,
    status: 'prospect',
    descriptor: 'Pharma — sterile parenteral production',
    employees: '~1,500 (site)',
    focusUnitId: 'vial-capping-crimping-machine',
  },
  {
    id: 'roche',
    name: 'Roche Diagnostics',
    city: 'Penzberg',
    lat: 47.7514,
    lng: 11.3756,
    status: 'existing',
    descriptor: 'Biotech campus — sterile biologics fill-finish',
    employees: '~7,000 (site)',
    focusUnitId: 'sterilizing-grade-filter-assembly',
  },
  {
    id: 'takeda',
    name: 'Takeda',
    city: 'Singen',
    lat: 47.7594,
    lng: 8.8403,
    status: 'prospect',
    descriptor: 'Pharma — sterile injectables & lyophilisation',
    employees: '~2,300 (site)',
    focusUnitId: 'environmental-monitoring-contamination-control',
  },
  {
    id: 'corden',
    name: 'CordenPharma',
    city: 'Plankstadt',
    lat: 49.3936,
    lng: 8.5972,
    status: 'prospect',
    descriptor: 'CDMO — sterile fill-finish & highly potent handling',
    employees: '~2,600',
    focusUnitId: 'hazardous-drug-hd-containment-handling-system',
  },
]
