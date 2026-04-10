import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import QRCode from 'react-qr-code'
import styles from './Invoice.module.css'

export default function Invoice() {
  const { orderId } = useParams<{ orderId: string }>()
  const order = useQuery(api.orders.getOrderById, { orderId: orderId || '' })
  
  // Need the SITE_URL for QR code tracking links
  const siteUrl = window.location.origin

  // Disable global scroll logic specific to this page
  useEffect(() => {
    window.scrollTo(0, 0)
    document.body.style.backgroundColor = '#e5e7eb' // Gray background for outside of paper
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  if (order === undefined) {
    return <div className={styles.loading}>Loading Invoice...</div>
  }

  // Not found or not authorized
  if (order === null) {
    return <Navigate to="/dashboard" />
  }

  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

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
            {/* PLACEHolders for user requested invoice details */}
            <p className={styles.companyDetail}>GSTIN: [Enter GST Here]</p>
            <p className={styles.companyDetail}>Address: [Enter Address Here]</p>
            <p className={styles.companyDetail}>Email: orders@bwrworks.in</p>
          </div>
          <div className={styles.invoiceInfo}>
            <h2 className={styles.invoiceTitle}>Tax Invoice / Bill of Supply</h2>
            <div className={styles.infoGrid}>
              <span className={styles.infoLabel}>Order ID:</span>
              <span className={styles.infoValue}>{order.orderId}</span>
              
              <span className={styles.infoLabel}>Order Date:</span>
              <span className={styles.infoValue}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
              
              <span className={styles.infoLabel}>Invoice Date:</span>
              <span className={styles.infoValue}>{new Date().toLocaleDateString('en-IN')}</span>

              <span className={styles.infoLabel}>Payment:</span>
              <span className={styles.infoValue}>{order.paymentStatus.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className={styles.addresses}>
          <div className={styles.addressBlock}>
            <h3 className={styles.addressTitle}>Billing Address</h3>
            <div className={styles.addressContent}>
              <strong>{order.addressSnapshot.name}</strong><br />
              {order.addressSnapshot.line1}<br />
              {order.addressSnapshot.line2 && <>{order.addressSnapshot.line2}<br /></>}
              {order.addressSnapshot.city}, {order.addressSnapshot.state} — {order.addressSnapshot.pincode}<br />
              Phone: {order.addressSnapshot.phone}
            </div>
          </div>
          <div className={styles.addressBlock}>
            <h3 className={styles.addressTitle}>Shipping Address</h3>
            <div className={styles.addressContent}>
              <strong>{order.addressSnapshot.name}</strong><br />
              {order.addressSnapshot.line1}<br />
              {order.addressSnapshot.line2 && <>{order.addressSnapshot.line2}<br /></>}
              {order.addressSnapshot.city}, {order.addressSnapshot.state} — {order.addressSnapshot.pincode}<br />
              Phone: {order.addressSnapshot.phone}
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
              // Extract pre-tax and tax amounts for formatting
              const itemTotal = item.unitPrice * item.quantity;
              const preTax = itemTotal / 1.18;
              const tax = itemTotal - preTax;

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{item.productName}</strong>
                    <div className={styles.itemMeta}>
                      HSN: [XXXX]
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
            <div className={styles.qrText}>Scan to Track Order</div>
          </div>
          <div className={styles.totalsTable}>
            <div className={styles.totalsRow}>
              <span>Subtotal:</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className={styles.totalsRow}>
                <span>Discount ({order.couponCode || 'Promo'}):</span>
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
          For any queries, please reach out to orders@bwrworks.in
        </div>
      </div>
    </div>
  )
}
