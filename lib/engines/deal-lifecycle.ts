/**
 * Lending Deal Lifecycle State Machine
 *
 * Defines valid stage transitions for loan applications.
 * All stage changes must pass through validateTransition() before being persisted.
 */

export type Stage =
  | 'lead'
  | 'pre_qualification'
  | 'underwriting'
  | 'approved'
  | 'active'
  | 'monitoring'
  | 'collection'
  | 'closed_won'
  | 'closed_lost'
  | 'default'

/** All stages that cannot be exited once entered */
export const TERMINAL_STAGES: Stage[] = ['closed_won', 'closed_lost']

/** 
 * All non-terminal stages. 
 * Any stage in this list can move to any other stage in this list OR any terminal stage.
 */
export const NON_TERMINAL_STAGES: Stage[] = [
  'lead',
  'pre_qualification',
  'underwriting',
  'approved',
  'active',
  'monitoring',
  'collection',
  'default'
]

/**
 * Valid transitions from each stage.
 * For non-terminal stages, we now allow moving to ANY other stage except leaving a terminal one.
 */
export const VALID_TRANSITIONS: Record<Stage, Stage[]> = {
  lead:              [...NON_TERMINAL_STAGES, ...TERMINAL_STAGES],
  pre_qualification: [...NON_TERMINAL_STAGES, ...TERMINAL_STAGES],
  underwriting:      [...NON_TERMINAL_STAGES, ...TERMINAL_STAGES],
  approved:          [...NON_TERMINAL_STAGES, ...TERMINAL_STAGES],
  active:            [...NON_TERMINAL_STAGES, ...TERMINAL_STAGES],
  monitoring:        [...NON_TERMINAL_STAGES, ...TERMINAL_STAGES],
  collection:        [...NON_TERMINAL_STAGES, ...TERMINAL_STAGES],
  default:           [...NON_TERMINAL_STAGES, ...TERMINAL_STAGES],
  closed_won:        [],  // terminal — no exits
  closed_lost:       [],  // terminal — no exits
}

export interface TransitionResult {
  allowed: boolean
  reason?: string
}

/**
 * Validates whether moving from `from` to `to` is a permitted lifecycle transition.
 */
export function validateTransition(from: Stage, to: Stage): TransitionResult {
  if (from === to) return { allowed: true }

  if (TERMINAL_STAGES.includes(from)) {
    return {
      allowed: false,
      reason: `Cannot move a loan out of terminal stage "${formatStage(from)}"`,
    }
  }

  // With the new flexible mapping, all transitions from non-terminal stages are allowed
  // as long as the target stage is valid (which it is if it's in our Stage type).
  return { allowed: true }
}

/** Human-readable stage label for error messages */
function formatStage(stage: Stage): string {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** All non-terminal (active pipeline) stages — useful for dashboard filters */
export const ACTIVE_STAGES: Stage[] = [
  'lead',
  'pre_qualification',
  'underwriting',
  'approved',
  'active',
  'monitoring',
  'collection',
]
