import { useEffect, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
// react-qr-code CJS→ESM interop is broken in Vite prod builds:
// default export resolves to module namespace { QRCode, default } instead of the component.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import _QRCodeModule from 'react-qr-code'
const QRCode: any = (_QRCodeModule as any)?.QRCode ?? (_QRCodeModule as any)?.default ?? _QRCodeModule
import styles from './Invoice.module.css'

/** Generate a simple Code128-style barcode as inline SVG */
function Barcode({ value }: { value: string }) {
  const bars = useMemo(() => {
    // Simple encoding: each char -> binary stripe pattern
    const result: boolean[] = []
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i)
      // Convert char code to 8-bit binary stripes
      for (let b = 7; b >= 0; b--) {
        result.push(Boolean((code >> b) & 1))
      }
      result.push(false) // gap between chars
    }
    return result
  }, [value])

  const barWidth = 1.5
  const height = 40
  const totalWidth = bars.length * barWidth

  return (
    <svg width={totalWidth} height={height + 14} viewBox={`0 0 ${totalWidth} ${height + 14}`} style={{ display: 'block' }}>
      {bars.map((on, i) => (
        on && (
          <rect
            key={i}
            x={i * barWidth}
            y={0}
            width={barWidth}
            height={height}
            fill="#111"
          />
        )
      ))}
      <text
        x={totalWidth / 2}
        y={height + 12}
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="#333"
      >
        {value}
      </text>
    </svg>
  )
}

export default function Invoice() {
  const { orderId } = useParams<{ orderId: string }>()
  const order = useQuery(api.orders.getOrderById, { orderId: orderId || '' })
  const cmsContent = useQuery(api.cms.getAll)

  const siteUrl = window.location.origin

  // Safely convert any value to a renderable string — prevents React Error #130
  const safe = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'string') return val
    if (typeof val === 'number' || typeof val === 'boolean') return String(val)
    try { return JSON.stringify(val) } catch { return '' }
  }

  // Helper to read CMS values with fallback
  const cms = (section: string, key: string, fallback: string) => {
    const entry = cmsContent?.find((c) => c.section === section && c.key === key)
    const val = entry?.value
    if (val === null || val === undefined) return fallback
    if (typeof val !== 'string') return fallback
    return val || fallback
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    document.body.style.backgroundColor = '#e5e7eb'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  if (order === undefined) {
    return <div className={styles.loading}>Loading Invoice...</div>
  }

  if (order === null) {
    return <Navigate to="/dashboard" />
  }

  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  const hsnCode = cms('invoice', 'hsn_code', '3926')

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={styles.invoiceWrapper}>
      {/* Non-printable action bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionLeft}>
          <button className={styles.btnSecondary} onClick={() => window.history.back()}>← Back</button>
        </div>
        <div className={styles.actionRight}>
          <button className={styles.btnPrint} onClick={handlePrint}>🖨️ Print Invoice</button>
        </div>
      </div>

      {/* Printable Invoice Page */}
      <div className={styles.invoicePage}>
        <div className={styles.header}>
          <div className={styles.companyInfo}>
            <h1 className={styles.companyName}>BWR WORKS</h1>
            <p className={styles.companyDetail}>Made in Bengaluru</p>
            <p className={styles.companyDetail}>GSTIN: {cms('invoice', 'gstin', '[Enter GST in Admin → Content]')}</p>
            <p className={styles.companyDetail}>{cms('invoice', 'company_address', '[Enter Address in Admin → Content]')}</p>
            <p className={styles.companyDetail}>Email: {cms('invoice', 'contact_email', 'orders@bwrworks.in')}</p>
          </div>
          <div className={styles.invoiceInfo}>
            <h2 className={styles.invoiceTitle}>Tax Invoice / Bill of Supply</h2>
            <div className={styles.infoGrid}>
              <span className={styles.infoLabel}>Order ID:</span>
              <span className={styles.infoValue}>{safe(order.orderId)}</span>

              <span className={styles.infoLabel}>Order Date:</span>
              <span className={styles.infoValue}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>

              <span className={styles.infoLabel}>Invoice Date:</span>
              <span className={styles.infoValue}>{new Date().toLocaleDateString('en-IN')}</span>

              <span className={styles.infoLabel}>Payment:</span>
              <span className={styles.infoValue}>{safe(order.paymentStatus).toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className={styles.addresses}>
          <div className={styles.addressBlock}>
            <h3 className={styles.addressTitle}>Billing Address</h3>
            <div className={styles.addressContent}>
              <strong>{safe(order.addressSnapshot.name)}</strong><br />
              {safe(order.addressSnapshot.line1)}<br />
              {order.addressSnapshot.line2 && <>{safe(order.addressSnapshot.line2)}<br /></>}
              {safe(order.addressSnapshot.city)}, {safe(order.addressSnapshot.state)} — {safe(order.addressSnapshot.pincode)}<br />
              Phone: {safe(order.addressSnapshot.phone)}
            </div>
          </div>
          <div className={styles.addressBlock}>
            <h3 className={styles.addressTitle}>Shipping Address</h3>
            <div className={styles.addressContent}>
              <strong>{safe(order.addressSnapshot.name)}</strong><br />
              {safe(order.addressSnapshot.line1)}<br />
              {order.addressSnapshot.line2 && <>{safe(order.addressSnapshot.line2)}<br /></>}
              {safe(order.addressSnapshot.city)}, {safe(order.addressSnapshot.state)} — {safe(order.addressSnapshot.pincode)}<br />
              Phone: {safe(order.addressSnapshot.phone)}
            </div>
          </div>
        </div>

        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>Sl.</th>
              <th style={{ width: '45%' }}>Description</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Gross</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Tax(18%)</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const itemTotal = item.unitPrice * item.quantity;
              const preTax = itemTotal / 1.18;
              const tax = itemTotal - preTax;

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{safe(item.productName)}</strong>
                    <div className={styles.itemMeta}>
                      HSN: {safe(hsnCode)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(preTax)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(tax)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(itemTotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className={styles.totalsSection}>
          <div className={styles.qrCodeBox}>
            <QRCode value={`${siteUrl}/order/${order.orderId}`} size={80} level="M" />
            <div className={styles.qrText}>Scan to Track</div>
          </div>

          {/* Barcode */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Barcode value={order.orderId} />
          </div>

          <div className={styles.totalsTable}>
            <div className={styles.totalsRow}>
              <span>Subtotal:</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className={styles.totalsRow}>
                <span>Discount ({safe(order.couponCode) || 'Promo'}):</span>
                <span>-{fmt(order.discountAmount)}</span>
              </div>
            )}
            <div className={styles.totalsRow}>
              <span>IGST (18%):</span>
              <span>{fmt(order.gstAmount)}</span>
            </div>
            <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
              <span>Grand Total:</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          This is a computer-generated document. No signature is required. <br />
          For any queries, please reach out to {cms('invoice', 'contact_email', 'orders@bwrworks.in')}
        </div>
      </div>
    </div>
  )
}
