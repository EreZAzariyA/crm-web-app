/**
 * Amortization Engine
 *
 * Pure TypeScript — zero framework imports.
 * Computes a standard fixed-rate loan amortization schedule.
 */

export interface AmortizationRow {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export interface AmortizationResult {
  rows: AmortizationRow[]
  monthlyPayment: number
  totalInterest: number
  totalPaid: number
}

/**
 * Computes a fixed-rate amortization schedule.
 *
 * @param principal   - Loan principal in dollars
 * @param annualRate  - Annual interest rate as a percentage (e.g. 5.5 for 5.5%)
 * @param termMonths  - Loan term in months
 */
export function computeAmortization(
  principal: number,
  annualRate: number,
  termMonths: number,
): AmortizationResult {
  const n = Math.round(termMonths)
  const r = annualRate / 100 / 12

  // Monthly payment via standard formula; fallback for zero-rate loans
  const monthlyPayment =
    r === 0
      ? principal / n
      : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)

  const rows: AmortizationRow[] = []
  let balance = principal

  for (let month = 1; month <= n; month++) {
    const interest = balance * r
    let principalPaid = monthlyPayment - interest
    let payment = monthlyPayment

    // Last row: clamp balance to 0 to absorb rounding drift
    if (month === n) {
      principalPaid = balance
      payment = balance + interest
    }

    balance = Math.max(0, balance - principalPaid)

    rows.push({
      month,
      payment:   Math.round(payment * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest:  Math.round(interest * 100) / 100,
      balance:   Math.round(balance * 100) / 100,
    })
  }

  const totalPaid = rows.reduce((s, r) => s + r.payment, 0)
  const totalInterest = totalPaid - principal

  return {
    rows,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest:  Math.round(totalInterest * 100) / 100,
    totalPaid:      Math.round(totalPaid * 100) / 100,
  }
}
