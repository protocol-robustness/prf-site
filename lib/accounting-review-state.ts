export type Candidate = 'A' | 'B'
export type ReviewState = {
  candidate: Candidate
  role: 'Reviewer' | 'Ratifier'
  verification: 'Pending' | 'Passed' | 'Failed'
  acceptance: 'Pending' | 'Accepted' | 'Rejected'
  ratification: 'Not ratified' | 'Ratified' | 'Blocked'
}
export type ReviewAction = { type: 'select'; candidate: Candidate }
  | { type: 'role'; role: ReviewState['role'] }
  | { type: 'verify' | 'accept' | 'reject' | 'ratify' | 'reset' }

export const initialReview = (candidate: Candidate = 'A'): ReviewState => ({
  candidate, role: 'Reviewer', verification: 'Pending', acceptance: 'Pending', ratification: 'Not ratified',
})

// Presentation simulation only. This reducer authenticates nobody and has no
// signing, persistence, wallet or execution API. Real records are downloads.
export function reviewTransition(state: ReviewState, action: ReviewAction, eligibility: Record<Candidate, boolean>): ReviewState {
  const eligible = eligibility[state.candidate]
  switch (action.type) {
    case 'select': return initialReview(action.candidate)
    case 'reset': return initialReview(state.candidate)
    case 'role': return { ...state, role: action.role }
    case 'verify': return { ...state, verification: eligible ? 'Passed' : 'Failed',
      ratification: !eligible || state.acceptance === 'Rejected' ? 'Blocked' : state.ratification }
    case 'accept': return eligible && state.verification === 'Passed' && state.acceptance === 'Pending' && state.role === 'Reviewer'
      ? { ...state, acceptance: 'Accepted' } : state
    case 'reject': return state.acceptance === 'Pending' && state.role === 'Reviewer'
      ? { ...state, acceptance: 'Rejected', ratification: 'Blocked' } : state
    case 'ratify': return eligible && state.verification === 'Passed' && state.acceptance === 'Accepted' && state.role === 'Ratifier'
      ? { ...state, ratification: 'Ratified' } : state
  }
}
