// Shared value-network helpers — the level colour ramp, tree building and
// product-trail marking, ported from the Waldner Sterile Fill-Finish report so
// the modal's Value Network panel renders in the same design language.

import type { CSSProperties, ReactNode } from 'react'
import type { TreeNode } from '@node42/ui-kit'
import { productUnitIds, valueNetwork } from './data'
import type { VNNode } from './data'

// Per-level colour, keyed by the value-network level label. One step of the
// tertiary (alt-blue) ramp per level — darkest at the top (L7), lightest at the
// leaves (L3) — so depth reads as shade. All values are ui-kit tokens.
export const LEVEL_STYLE: Record<string, { bg: string; fg: string }> = {
  L7: { bg: 'var(--tertiary-800)', fg: 'var(--white)' },
  L6: { bg: 'var(--tertiary-default)', fg: 'var(--white)' },
  L6a: { bg: 'var(--tertiary-400)', fg: 'var(--white)' },
  L5: { bg: 'var(--tertiary-200)', fg: 'var(--secondary-700)' },
  L4: { bg: 'var(--tertiary-100)', fg: 'var(--secondary-700)' },
  L3: { bg: 'var(--tertiary-50)', fg: 'var(--secondary-700)' },
}

export function levelStyle(label: ReactNode): CSSProperties {
  const key = typeof label === 'string' ? label.split('.')[0] : ''
  const c = LEVEL_STYLE[key] || { bg: 'var(--surface-default-default-2)', fg: 'var(--text-body)' }
  return { background: c.bg, color: c.fg }
}

// Flag the product node(s) and the ancestry trail down to them.
export const productIds = new Set<string>()
export const trailIds = new Set<string>()
;(function mark(node: VNNode, ancestors: string[]) {
  if (productUnitIds.has(node.id)) {
    productIds.add(node.id)
    for (const a of ancestors) trailIds.add(a)
  }
  if (node.children) for (const c of node.children) mark(c, [...ancestors, node.id])
})(valueNetwork.root, [])

export const nodeById = new Map<string, VNNode>()
export const defaultExpandedIds: string[] = []

// Build the ui-kit TreeView node graph, tagging each row with a per-level badge.
// The row `text` is left as the plain name here; the panel decorates product
// rows with an icon at render time.
export function toTreeNode(n: VNNode, badge: string): TreeNode {
  nodeById.set(n.id, n)
  if (n.level === 'L7') defaultExpandedIds.push(n.id)
  const node: TreeNode = { id: n.id, badge, text: n.name, badgeStyle: levelStyle(n.level) }
  if (n.children?.length) {
    const perLevel: Record<string, number> = {}
    node.children = n.children.map((c) => {
      perLevel[c.level] = (perLevel[c.level] ?? 0) + 1
      return toTreeNode(c, `${c.level}.${perLevel[c.level]}`)
    })
  }
  return node
}

export const valueTree: TreeNode[] = [toTreeNode(valueNetwork.root, valueNetwork.root.level)]

// Walk to the node with `id`, returning the root→node chain (inclusive).
export function findNodePath(nodes: TreeNode[], id: string): TreeNode[] {
  for (const node of nodes) {
    if (node.id === id) return [node]
    if (node.children) {
      const sub = findNodePath(node.children, id)
      if (sub.length) return [node, ...sub]
    }
  }
  return []
}

// Prune the tree to nodes whose name matches `query`, keeping ancestors.
export function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return nodes
  const walk = (node: TreeNode): TreeNode | null => {
    const name = nodeById.get(node.id)?.name ?? (typeof node.text === 'string' ? node.text : '')
    if (name.toLowerCase().includes(q)) return node
    const kids = (node.children ?? []).map(walk).filter(Boolean) as TreeNode[]
    return kids.length ? { ...node, children: kids } : null
  }
  return nodes.map(walk).filter(Boolean) as TreeNode[]
}

export const allNodeIds = (nodes: TreeNode[]): string[] =>
  nodes.flatMap((n) => [n.id, ...(n.children ? allNodeIds(n.children) : [])])
