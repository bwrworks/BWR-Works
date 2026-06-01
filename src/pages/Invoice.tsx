import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useCms } from '../hooks/useCms'
import { fmt, safe } from '../lib/formatters'
import Logo from '../components/ui/Logo'
import styles from './Invoice.module.css'

export default function Invoice() {
  const { orderId } = useParams<{ orderId: string }>()
  const order = useQuery(api.orders.getOrderById, { orderId: orderId || '' })
  const { cms } = useCms()
  const pricingDefaults = useQuery(api.pricing.getPricingDefaults)

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

  if (!order || !order.addressSnapshot || !order.items) {
    return <Navigate to="/dashboard" />
  }

  const hsnCode = cms('invoice', 'hsn_code', '3926')
  const isGstEnabled = pricingDefaults ? pricingDefaults.gstPercent > 0 : false

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
            <Logo style={{ height: 40, width: 'auto', marginBottom: 12, color: 'var(--ink)' }} />
            <p className={styles.companyDetail}>Made in Bengaluru</p>
            {cms('invoice', 'gstin', '[Enter GST in Admin → Content]') !== '[Enter GST in Admin → Content]' && (
              <p className={styles.companyDetail}>GSTIN: {cms('invoice', 'gstin', '')}</p>
            )}
            {cms('invoice', 'company_address', '[Enter Address in Admin → Content]') !== '[Enter Address in Admin → Content]' && (
              <p className={styles.companyDetail}>{cms('invoice', 'company_address', '')}</p>
            )}
            {cms('invoice', 'contact_email', 'contact@bwrworks.com') !== 'contact@bwrworks.com' && (
              <p className={styles.companyDetail}>Email: {cms('invoice', 'contact_email', '')}</p>
            )}
          </div>
          <div className={styles.invoiceInfo}>
            <h2 className={styles.invoiceTitle}>{isGstEnabled ? 'TAX INVOICE' : 'INVOICE / BILL OF SUPPLY'}</h2>
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
              {isGstEnabled && <th style={{ width: '15%', textAlign: 'right' }}>Gross</th>}
              {isGstEnabled && <th style={{ width: '10%', textAlign: 'right' }}>Tax(18%)</th>}
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
                  {isGstEnabled && <td style={{ textAlign: 'right' }}>{fmt(preTax)}</td>}
                  {isGstEnabled && <td style={{ textAlign: 'right' }}>{fmt(tax)}</td>}
                  <td style={{ textAlign: 'right' }}>{fmt(itemTotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className={styles.totalsSection}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              fontFamily: 'monospace', fontSize: '0.85rem',
              fontWeight: 700, color: '#111',
              letterSpacing: '0.05em', padding: '8px 16px',
              border: '1px solid #ddd', borderRadius: 4,
            }}>{order.orderId}</div>
            <div className={styles.qrText}>Order Reference</div>
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
            {isGstEnabled && (
              <div className={styles.totalsRow}>
                <span>IGST (18%):</span>
                <span>{fmt(order.gstAmount)}</span>
              </div>
            )}
            <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
              <span>Grand Total:</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          This is a computer-generated document. No signature is required. <br />
          For any queries, please reach out to {cms('invoice', 'contact_email', 'contact@bwrworks.com')}
        </div>
      </div>
    </div>
  )
}
