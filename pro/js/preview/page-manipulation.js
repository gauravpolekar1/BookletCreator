import { createDefaultPagePlan } from '../state.js'

/**
 * Replaces one page-plan entry with N repeated source entries.
 * @param {import('../state.js').PagePlanEntry[]} pagePlan Current plan.
 * @param {number} index Entry index to repeat.
 * @param {number} count Number of copies to create.
 * @returns {import('../state.js').PagePlanEntry[]} Updated page plan.
 */
export function repeatEntry(pagePlan, index, count) {
  const entry = pagePlan[index]
  const copies = Math.max(1, Number(count || 1))
  if (!entry || entry.kind !== 'source') return pagePlan.slice()
  const repeatGroupId = getNextRepeatGroupId(pagePlan)
  const plan = pagePlan.slice()
  plan.splice(index, 1, ...Array.from({ length: copies }, () => ({
    kind: 'source',
    sourceIndex: entry.sourceIndex,
    repeatGroupId
  })))
  return plan
}

/**
 * Inserts a blank page-plan entry after the supplied index.
 * @param {import('../state.js').PagePlanEntry[]} pagePlan Current plan.
 * @param {number} index Entry index to insert after.
 * @returns {import('../state.js').PagePlanEntry[]} Updated page plan.
 */
export function insertBlankAfter(pagePlan, index) {
  const plan = pagePlan.slice()
  plan.splice(index + 1, 0, { kind: 'blank' })
  return plan
}

/**
 * Moves one page-plan entry to another index.
 * @param {import('../state.js').PagePlanEntry[]} pagePlan Current plan.
 * @param {number} fromIndex Current entry index.
 * @param {number} toIndex Destination entry index.
 * @returns {import('../state.js').PagePlanEntry[]} Updated page plan.
 */
export function moveEntry(pagePlan, fromIndex, toIndex) {
  const plan = pagePlan.slice()
  const [entry] = plan.splice(fromIndex, 1)
  if (!entry) return pagePlan.slice()
  plan.splice(Math.max(0, Math.min(toIndex, plan.length)), 0, entry)
  return plan
}

/**
 * Deletes a page-plan entry.
 * @param {import('../state.js').PagePlanEntry[]} pagePlan Current plan.
 * @param {number} index Entry index to remove.
 * @returns {import('../state.js').PagePlanEntry[]} Updated page plan.
 */
export function deleteEntry(pagePlan, index) {
  const plan = pagePlan.slice()
  plan.splice(index, 1)
  return plan
}

/**
 * Restores the page plan to source PDF order.
 * @param {number} pageCount Source PDF page count.
 * @returns {import('../state.js').PagePlanEntry[]} Default source-order page plan.
 */
export function restoreSourceOrder(pageCount) {
  return createDefaultPagePlan(pageCount)
}

function getNextRepeatGroupId(pagePlan) {
  return pagePlan.reduce((nextId, entry) => (
    Number.isInteger(entry?.repeatGroupId) ? Math.max(nextId, entry.repeatGroupId + 1) : nextId
  ), 1)
}
