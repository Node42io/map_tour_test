import { useCallback, useEffect, useRef, useState } from 'react'

/* Game-tutorial style guided tour for the Modal Map concept.

   This app is state-driven (no router): a company modal opens when an account
   row is clicked, and a Toggle switches the modal between Value Network and
   Needs. The tour therefore drives the real UI by clicking those elements, so
   every step is idempotent — each step declares the world-state it needs
   (`ensure`) and the tour makes the DOM match before highlighting. */

type Ensure = 'no-modal' | 'modal-vn' | 'modal-needs'

interface TourStep {
  ensure: Ensure
  target?: string        // CSS selector to highlight; omit for a centered card
  overlay: 'spotlight' | 'plain'  // 'plain' = no dark shade (modal already dims)
  micro: string
  title: string
  body: string
}

const STEPS: TourStep[] = [
  {
    ensure: 'no-modal',
    overlay: 'spotlight',
    micro: 'MODAL MAP · CONCEPT',
    title: 'A customer map fused with the value network.',
    body: 'Behind this card is a live map of sterile fill-finish manufacturers (NAICS 325412) across southern Germany. Selecting any account spotlights its value network over the dimmed map. Use → / ← or the buttons.',
  },
  {
    ensure: 'no-modal',
    target: '.n42-legend',
    overlay: 'spotlight',
    micro: 'THE PINS',
    title: 'Existing customers vs. prospects.',
    body: 'Every account is a pin on the map. Yellow pins are existing customers, white pins are prospects — the same colour coding repeats in the account list.',
  },
  {
    ensure: 'no-modal',
    target: '.n42-sidebar',
    overlay: 'spotlight',
    micro: 'THE ACCOUNT LIST',
    title: 'Southern-Germany accounts, at a glance.',
    body: 'The floating list mirrors the map: NAICS code, total accounts and how many are existing customers. Each row is a company you can open.',
  },
  {
    ensure: 'no-modal',
    target: '.n42-co-row',
    overlay: 'spotlight',
    micro: 'PICK AN ACCOUNT',
    title: 'Open an account to see its value network.',
    body: "Selecting a company opens a near-fullscreen modal focused on the value-network unit that account's engagement centres on. Press Next — we'll open the first one.",
  },
  {
    ensure: 'modal-vn',
    target: '[data-tour="vn-tree"]',
    overlay: 'plain',
    micro: 'INSIDE · VALUE NETWORK',
    title: 'The Sterile Fill-Finish value network.',
    body: '6,616 functional units, L7 → L3, opened pre-focused on this account. Cube markers flag units matched to a Waldner product; dots trace the path up to the root.',
  },
  {
    ensure: 'modal-vn',
    target: '[data-tour="vn-detail"]',
    overlay: 'plain',
    micro: 'INSIDE · UNIT DETAIL',
    title: 'What matters for the selected unit.',
    body: 'For the focused unit: its matched products, the core functional job, the path schema, and the buying centre — ESCO-coded stakeholders and their jobs.',
  },
  {
    ensure: 'modal-vn',
    target: '[data-tour="view-toggle"]',
    overlay: 'plain',
    micro: 'INSIDE · TWO VIEWS',
    title: 'Toggle to the Needs view.',
    body: 'The same modal holds two lenses on a unit: the Value Network you just saw, and the Needs matrix. Press Next to switch lenses.',
  },
  {
    ensure: 'modal-needs',
    target: '[data-tour="needs-panel"]',
    overlay: 'plain',
    micro: 'INSIDE · NEEDS (ODI)',
    title: 'Outcome-Driven Innovation matrix.',
    body: 'Every desired outcome scored on importance × satisfaction → opportunity. Underserved rows (importance ≫ satisfaction) are where the whitespace is; expand a row for its rationale.',
  },
  {
    ensure: 'no-modal',
    overlay: 'spotlight',
    micro: 'TOUR COMPLETE 🏆',
    title: 'That is the whole loop.',
    body: 'Map → account → value network → needs, all over one live map. Click any pin or account to explore for real, or replay this tour from the ▶ button any time.',
  },
]

const DONE_KEY = 'n42-modalmap-tour-done'

const TOUR_STYLE = `
.mmt-shade{position:fixed;inset:0;z-index:9990;background:rgba(20,22,25,.62)}
.mmt-ring{position:fixed;z-index:9991;border-radius:12px;pointer-events:none;transition:top .3s cubic-bezier(.4,0,.2,1),left .3s cubic-bezier(.4,0,.2,1),width .3s cubic-bezier(.4,0,.2,1),height .3s cubic-bezier(.4,0,.2,1),opacity .22s ease}
.mmt-ring--spot{border:1.5px solid var(--primary-500,#c8e36a);box-shadow:0 0 0 4px color-mix(in srgb,var(--primary-500,#c8e36a) 25%,transparent),0 0 0 200vmax rgba(20,22,25,.62)}
.mmt-ring--plain{border:2px solid var(--primary-500,#c8e36a);box-shadow:0 0 0 4px color-mix(in srgb,var(--primary-500,#c8e36a) 22%,transparent),0 8px 32px rgba(0,0,0,.28)}
.mmt-card{position:fixed;z-index:9993;width:min(384px,calc(100vw - 32px));background:var(--surface-default-default,#161a16);border:1px solid var(--border-card,#2a2e24);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 60px rgba(0,0,0,.5);transition:top .3s cubic-bezier(.4,0,.2,1),left .3s cubic-bezier(.4,0,.2,1),opacity .22s ease}
.mmt-micro{font-family:var(--font-family-mono,monospace);font-size:11px;letter-spacing:.12em;color:var(--primary-500,#c8e36a);text-transform:uppercase}
.mmt-title{font-size:18px;font-weight:600;color:var(--text-headings,#f4f6ef);line-height:1.25;margin:0}
.mmt-body{font-size:13px;color:var(--text-description,#9aa08e);line-height:1.55;margin:0}
.mmt-bar{height:3px;background:var(--border-card,#2a2e24);border-radius:2px;overflow:hidden;margin-top:4px}
.mmt-bar i{display:block;height:100%;background:var(--primary-500,#c8e36a);transition:width .3s ease}
.mmt-foot{display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:12px}
.mmt-count{font-family:var(--font-family-mono,monospace);font-size:11px;letter-spacing:.1em;color:var(--text-description,#777)}
.mmt-btns{display:flex;gap:8px}
.mmt-btn{font-family:var(--font-family-mono,monospace);font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:7px 14px;border-radius:999px;border:1px solid var(--border-card,#2a2e24);background:transparent;color:var(--text-description,#9aa08e);cursor:pointer}
.mmt-btn:hover{color:var(--text-headings,#f4f6ef)}
.mmt-btn--primary{background:var(--primary-500,#c8e36a);border-color:var(--primary-500,#c8e36a);color:#0f1108;font-weight:600}
.mmt-btn--primary:hover{color:#0f1108;filter:brightness(1.06)}
.mmt-btn--ghost{border:none;padding-left:0}
.mmt-launch{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:9980;display:inline-flex;align-items:center;gap:8px;font-family:var(--font-family-mono,monospace);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:9px 16px;border-radius:999px;border:1px solid var(--border-card,#2a2e24);background:var(--surface-default-default,#161a16);color:var(--text-description,#9aa08e);cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.35)}
.mmt-launch:hover{color:var(--primary-500,#c8e36a);border-color:var(--primary-500,#c8e36a)}
`

const PAD = 8

// ── DOM drivers ───────────────────────────────────────────────────────────
const q = (sel: string) => document.querySelector<HTMLElement>(sel)
const modalOpen = () => !!q('.n42-modal')

function ensureWorld(ensure: Ensure) {
  if (ensure === 'no-modal') {
    if (modalOpen()) q('.n42-backdrop [aria-label="Close"]')?.click()
    return
  }
  // modal-vn / modal-needs both need the modal open
  if (!modalOpen()) q('.n42-co-row')?.click()
  const wantNeeds = ensure === 'modal-needs'
  // Toggle radios: index 0 = Value Network, 1 = Needs
  const radios = document.querySelectorAll<HTMLElement>('[data-tour="view-toggle"] [role="radio"]')
  const desired = radios[wantNeeds ? 1 : 0]
  if (desired && desired.getAttribute('aria-checked') !== 'true') desired.click()
}

export function Tour() {
  const [step, setStep] = useState(-1)     // -1 = inactive
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [ready, setReady] = useState(false)
  const pollRef = useRef<number>(0)
  const swapRef = useRef<number>(0)

  const active = step >= 0 && step < STEPS.length
  const current = active ? STEPS[step] : null

  const finish = useCallback(() => {
    localStorage.setItem(DONE_KEY, '1')
    ensureWorld('no-modal')
    setStep(-1)
    setRect(null)
  }, [])

  const go = useCallback((next: number) => {
    if (next < 0) return
    setReady(false)                                 // fade current card + ring out, in place
    window.clearTimeout(swapRef.current)
    if (next >= STEPS.length) {
      swapRef.current = window.setTimeout(finish, 200)
    } else {
      // Keep the old rect during the fade so nothing snaps; the next step's
      // effect measures the new target, then fades + glides in.
      swapRef.current = window.setTimeout(() => setStep(next), 170)
    }
  }, [finish])

  // Auto-start once, on first visit.
  useEffect(() => {
    if (localStorage.getItem(DONE_KEY)) return
    const t = window.setTimeout(() => setStep((s) => (s === -1 ? 0 : s)), 600)
    return () => window.clearTimeout(t)
  }, [])

  // On step change: make the world match, then poll for the target element.
  useEffect(() => {
    if (!current) return
    ensureWorld(current.ensure)
    const started = performance.now()
    const measure = () => {
      if (!current.target) { setRect(null); setReady(true); return }
      const el = q(current.target)
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' })
        setRect(el.getBoundingClientRect())
        setReady(true)
        return
      }
      if (performance.now() - started < 3500) {
        pollRef.current = window.setTimeout(measure, 80)
      } else {
        setRect(null); setReady(true)  // fallback: centered card
      }
    }
    pollRef.current = window.setTimeout(measure, 90)  // let ensure/mount settle
    return () => window.clearTimeout(pollRef.current)
  }, [step, current])

  // Keep the highlight aligned on resize/scroll.
  useEffect(() => {
    if (!active || !current?.target) return
    const remeasure = () => { const el = q(current.target!); if (el) setRect(el.getBoundingClientRect()) }
    window.addEventListener('resize', remeasure)
    window.addEventListener('scroll', remeasure, true)
    return () => {
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('scroll', remeasure, true)
    }
  }, [active, current])

  // Keyboard controls.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); go(step + 1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(step - 1) }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active, step, go, finish])

  if (!active) {
    return (
      <>
        <style>{TOUR_STYLE}</style>
        <button className="mmt-launch" onClick={() => go(0)}>▶ Tour</button>
      </>
    )
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const plain = current!.overlay === 'plain'

  const ring = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null

  // Card placement.
  const CARD_W = Math.min(384, vw - 32)
  const CARD_H = 230
  let cardTop: number
  let cardLeft: number
  if (!ring) {
    cardTop = vh / 2 - CARD_H / 2
    cardLeft = vw / 2 - CARD_W / 2
  } else if (plain) {
    // Inside the modal: pin the card opposite the highlighted region.
    const targetMidY = ring.top + ring.height / 2
    cardTop = targetMidY < vh / 2 ? vh - CARD_H - 24 : 24
    cardLeft = vw / 2 - CARD_W / 2
  } else {
    // Spotlight: place beside/below the target, clamped to the viewport.
    const below = ring.top + ring.height + 16
    const tall = ring.height > vh * 0.55
    if (tall) {
      // e.g. the sidebar — sit to its right, vertically centered
      cardTop = Math.max(16, vh / 2 - CARD_H / 2)
      cardLeft = ring.left + ring.width + 16 + CARD_W < vw
        ? ring.left + ring.width + 16
        : Math.max(16, ring.left - CARD_W - 16)
    } else {
      cardTop = below + CARD_H < vh ? below : Math.max(16, ring.top - CARD_H - 16)
      cardLeft = Math.min(Math.max(16, ring.left), vw - CARD_W - 16)
    }
  }

  const last = step === STEPS.length - 1
  const pct = ((step + 1) / STEPS.length) * 100

  return (
    <>
      <style>{TOUR_STYLE}</style>
      {!plain && <div className="mmt-shade" onClick={() => go(step + 1)} />}
      {ring && (
        <div
          className={`mmt-ring ${plain ? 'mmt-ring--plain' : 'mmt-ring--spot'}`}
          style={{ ...ring, opacity: ready ? 1 : 0 }}
        />
      )}
      <div className="mmt-card" style={{ top: cardTop, left: cardLeft, opacity: ready ? 1 : 0 }}>
        <span className="mmt-micro">{current!.micro}</span>
        <h3 className="mmt-title">{current!.title}</h3>
        <p className="mmt-body">{current!.body}</p>
        <div className="mmt-bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="mmt-foot">
          <span className="mmt-count">STEP {String(step + 1).padStart(2, '0')} / {STEPS.length}</span>
          <div className="mmt-btns">
            <button className="mmt-btn mmt-btn--ghost" onClick={finish}>Skip</button>
            {step > 0 && <button className="mmt-btn" onClick={() => go(step - 1)}>← Back</button>}
            <button className="mmt-btn mmt-btn--primary" onClick={() => go(step + 1)}>
              {last ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
