// UPI configuration — change UPI_ID to your actual UPI ID
export const UPI_ID   = 'cafe@upi'
export const UPI_NAME = 'CaféPOS'

/**
 * Generates a UPI deep link that opens any UPI app (GPay, PhonePe, Paytm etc.)
 * when scanned with a phone camera or UPI app.
 */
export function upiLink(amount, note = 'Cafe Order') {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_NAME,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  })
  return `upi://pay?${params.toString()}`
}
