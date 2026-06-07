import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatPrice } from '../../lib/formatters'
import styles from './AdminCustomOrders.module.css'

type ActiveTab = 'requested' | 'quoted' | 'active' | 'fulfilled'

export default function AdminCustomOrders() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('requested')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Queries
  const allRequests = useQuery(api.customPrints.getAllCustomPrintsAdmin, {})
  const defaults = useQuery(api.pricing.getPricingDefaults)

  // Mutations
  const submitQuote = useMutation(api.customPrints.submitCustomPrintQuote)
  const updateStatus = useMutation(api.customPrints.updateCustomPrintStatusAdmin)

  // Quote form state
  const [weight, setWeight] = useState(0)
  const [printTime, setPrintTime] = useState(0)
  const [labourTime, setLabourTime] = useState(0)
  const [pkgCost, setPkgCost] = useState('')
  const [extraCost, setExtraCost] = useState('')
  
  // Fulfillment form state
  const [trackingNum, setTrackingNum] = useState('')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filter requests based on tab
  const getFilteredRequests = () => {
    if (!allRequests) return []
    if (activeTab === 'requested') return allRequests.filter(r => r.status === 'requested')
    if (activeTab === 'quoted') return allRequests.filter(r => r.status === 'quoted')
    if (activeTab === 'active') return allRequests.filter(r => ['ordered', 'printing', 'shipped'].includes(r.status))
    if (activeTab === 'fulfilled') return allRequests.filter(r => r.status === 'delivered')
    return []
  }

  const filtered = getFilteredRequests()
  const selectedReq = allRequests?.find(r => r._id === selectedId) || filtered[0]

  // Reset form fields when selected request changes
  useEffect(() => {
    if (selectedReq) {
      setSelectedId(selectedReq._id)
      setNotes(selectedReq.adminNotes || '')
      setTrackingNum(selectedReq.trackingNumber || '')
      setError('')
      setSuccess('')
      
      if (selectedReq.pricing) {
        setWeight(selectedReq.pricing.materialWeightGrams)
        setPrintTime(selectedReq.pricing.printTimeMinutes)
        setLabourTime(selectedReq.pricing.labourTimeMinutes)
        setPkgCost(String(selectedReq.pricing.packagingCost))
        setExtraCost(String(selectedReq.pricing.customPrintExtraCost))
      } else if (defaults) {
        setWeight(0)
        setPrintTime(0)
        setLabourTime(0)
        setPkgCost(String(defaults.defaultPackagingCost))
        setExtraCost(String(defaults.customPrintExtraCost ?? 500))
      }
    } else {
      setSelectedId(null)
    }
  }, [selectedId, selectedReq, activeTab, defaults])

  if (allRequests === undefined || defaults === undefined) {
    return <div className={styles.loading}>Loading Custom Orders dashboard…</div>
  }

  // Live price calculation mirroring formula
  const calculateLiveBreakdown = () => {
    if (!defaults) return null

    const materialRate = defaults.materialCostPerKg
    const consumablesRate = defaults.consumablesPercent
    const overheadsRate = defaults.overheadsCost

    const material = (weight / 1000) * materialRate
    const electricity = (printTime / 60) * defaults.electricityCostPerHour
    const machine = (printTime / 60) * defaults.machineDepreciationPerHour
    const consumables = material * (consumablesRate / 100)
    const design = Number(extraCost || defaults.customPrintExtraCost || 500)
    const labour = (labourTime / 60) * defaults.labourCostPerHour
    const packaging = pkgCost !== '' ? Number(pkgCost) : defaults.defaultPackagingCost
    const overheads = overheadsRate

    const subtotalCost = material + electricity + machine + consumables + design + labour + packaging + overheads
    const riskBuffer = subtotalCost * (defaults.riskBufferPercent / 100)
    const trueCost = subtotalCost + riskBuffer
    const margin = trueCost * (defaults.b2cMarginPercent / 100)
    const sellingPrice = trueCost + margin

    // In paise
    const sellingPricePaise = Math.round(sellingPrice * 100)
    const gstPercent = defaults.gstPercent ?? 18
    const gstAmountPaise = Math.round(sellingPricePaise * (gstPercent / 100))
    const totalPaise = sellingPricePaise + gstAmountPaise

    return {
      material, electricity, machine, consumables, design,
      labour, packaging, overheads, subtotalCost, riskBuffer,
      trueCost, margin, sellingPrice: sellingPricePaise,
      gstAmount: gstAmountPaise, total: totalPaise
    }
  }

  const live = calculateLiveBreakdown()

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq) return

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await submitQuote({
        id: selectedReq._id,
        materialWeightGrams: weight,
        printTimeMinutes: printTime,
        labourTimeMinutes: labourTime,
        packagingCost: pkgCost !== '' ? Number(pkgCost) : undefined,
        customPrintExtraCost: extraCost !== '' ? Number(extraCost) : undefined,
      })
      setSuccess('Quotation sent to user successfully!')
    } catch (err: any) {
      setError(err?.message || 'Failed to submit quote.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (status: 'printing' | 'shipped' | 'delivered') => {
    if (!selectedReq) return

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await updateStatus({
        id: selectedReq._id,
        status,
        trackingNumber: status === 'shipped' ? trackingNum : undefined,
        adminNotes: notes || undefined,
      })
      setSuccess(`Order status updated to ${status}!`)
    } catch (err: any) {
      setError(err?.message || 'Failed to update order status.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveNotesOnly = async () => {
    if (!selectedReq) return
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Pass the current status back with the updated notes
      await updateStatus({
        id: selectedReq._id,
        status: selectedReq.status as any,
        adminNotes: notes,
      })
      setSuccess('Notes updated successfully!')
    } catch (err: any) {
      setError(err?.message || 'Failed to update notes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    requested: 'Awaiting Quote',
    quoted: 'Quoted',
    ordered: 'Paid & Queued',
    printing: 'Crafting',
    shipped: 'Shipped',
    delivered: 'Delivered',
  }

  return (
    <div className={styles.page}>
      
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Custom Orders Dashboard</span>
        <div className={styles.headerSpacer} />
        <span className={styles.headerStats}>
          {allRequests.filter(r => r.status === 'requested').length} pending review
        </span>
      </div>

      <div className={styles.content}>
        
        {/* ── TABS ── */}
        <div className={styles.tabsRow}>
          {(['requested', 'quoted', 'active', 'fulfilled'] as ActiveTab[]).map(tab => {
            const count = allRequests.filter(r => {
              if (tab === 'requested') return r.status === 'requested'
              if (tab === 'quoted') return r.status === 'quoted'
              if (tab === 'active') return ['ordered', 'printing', 'shipped'].includes(r.status)
              return r.status === 'delivered'
            }).length

            return (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
                onClick={() => {
                  setActiveTab(tab)
                  setSelectedId(null)
                }}
              >
                {tab === 'requested' && 'Awaiting Quote'}
                {tab === 'quoted' && 'Quoted'}
                {tab === 'active' && 'Active (Paid)'}
                {tab === 'fulfilled' && 'Delivered'}
                <span className={styles.tabBadge}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className={styles.dashboardLayout}>
          
          {/* ── LEFT PANEL: ORDERS LIST ── */}
          <div className={styles.listCard}>
            {filtered.length === 0 ? (
              <div className={styles.emptyList}>No custom orders in this tab.</div>
            ) : (
              <div className={styles.list}>
                {filtered.map(r => (
                  <button
                    key={r._id}
                    className={`${styles.listItem} ${selectedId === r._id ? styles.listItemSelected : ''}`}
                    onClick={() => setSelectedId(r._id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className={styles.listItemId}>{r.customPrintId}</span>
                      <span className={styles.listItemTime}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className={styles.listItemCustomer}>{r.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                      {r.pricing && (
                        <span className={styles.listItemPrice}>{formatPrice(r.pricing.total)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: DETAILED PREVIEW & EDIT ── */}
          <div className={styles.detailCard}>
            {selectedReq ? (
              <div className={styles.details}>
                {error && <div className={styles.errorAlert}>{error}</div>}
                {success && <div className={styles.successAlert}>{success}</div>}

                {/* Profile Snapshot */}
                <div className={styles.customerHeader}>
                  <div>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>
                      {selectedReq.customPrintId}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      Requested by {selectedReq.name} ({selectedReq.email})
                    </span>
                  </div>
                  <div className={styles.detailStatusBadge}>
                    {selectedReq.status.toUpperCase()}
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 24 }}>
                  <label className={styles.sectionLabel}>Customer Request</label>
                  <p className={styles.requestDescription}>{selectedReq.description}</p>
                </div>

                {/* Images */}
                {selectedReq.images && selectedReq.images.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <label className={styles.sectionLabel}>Reference Photos</label>
                    <div className={styles.imagesGrid}>
                      {selectedReq.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                          <img src={img} alt="reference" className={styles.previewImage} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quoted Pricing details (if quoted/active) */}
                {selectedReq.pricing && (
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--line)', padding: 18, borderRadius: 6, marginBottom: 24 }}>
                    <label className={styles.sectionLabel} style={{ marginBottom: 8 }}>Quoted Price Breakdown</label>
                    <div className={styles.pricingSummaryGrid}>
                      <div>
                        <span>Filament:</span> <strong>{selectedReq.pricing.materialWeightGrams}g</strong>
                      </div>
                      <div>
                        <span>Print Time:</span> <strong>{selectedReq.pricing.printTimeMinutes} min</strong>
                      </div>
                      <div>
                        <span>Design Surcharge:</span> <strong>₹{selectedReq.pricing.customPrintExtraCost}</strong>
                      </div>
                      <div>
                        <span>Total Quote:</span> <strong style={{ color: 'var(--orange)' }}>{formatPrice(selectedReq.pricing.total)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Address snapshot */}
                {selectedReq.addressSnapshot && (
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--line)', padding: 18, borderRadius: 6, marginBottom: 24 }}>
                    <label className={styles.sectionLabel} style={{ marginBottom: 8 }}>Delivery Address</label>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#eaeaea' }}>
                      <strong>{selectedReq.addressSnapshot.name}</strong><br />
                      {selectedReq.addressSnapshot.line1}<br />
                      {selectedReq.addressSnapshot.line2 && <>{selectedReq.addressSnapshot.line2}<br /></>}
                      {selectedReq.addressSnapshot.city}, {selectedReq.addressSnapshot.state} — {selectedReq.addressSnapshot.pincode}<br />
                      📱 {selectedReq.addressSnapshot.phone}
                    </div>
                  </div>
                )}

                {/* Quotation Form (Requested status only) */}
                {selectedReq.status === 'requested' && (
                  <form onSubmit={handleSendQuote} className={styles.quoteForm}>
                    <h3 className={styles.formTitle}>Quotation Cost Calculator</h3>
                    
                    <div className={styles.formGrid}>
                      <div className={styles.formField}>
                        <label>Material Weight (grams)</label>
                        <input
                          type="number"
                          value={weight}
                          onChange={e => setWeight(Math.max(0, Number(e.target.value)))}
                          placeholder="e.g. 80"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label>Print Time (minutes)</label>
                        <input
                          type="number"
                          value={printTime}
                          onChange={e => setPrintTime(Math.max(0, Number(e.target.value)))}
                          placeholder="e.g. 120"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label>Labour/QC Time (minutes)</label>
                        <input
                          type="number"
                          value={labourTime}
                          onChange={e => setLabourTime(Math.max(0, Number(e.target.value)))}
                          placeholder="e.g. 15"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label>Custom Design Surcharge (₹)</label>
                        <input
                          type="number"
                          value={extraCost}
                          onChange={e => setExtraCost(e.target.value)}
                          placeholder={`Default: ₹${defaults?.customPrintExtraCost ?? 500}`}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Cost Breakdown Preview */}
                    {live && (
                      <div className={styles.breakdownPreview}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--orange)' }}>LIVE COST BREAKDOWN PREVIEW</h4>
                        <div className={styles.previewRow}><span>Filament Cost</span><span>₹{live.material.toFixed(2)}</span></div>
                        <div className={styles.previewRow}><span>Machine Depr. & Elec.</span><span>₹{(live.electricity + live.machine).toFixed(2)}</span></div>
                        <div className={styles.previewRow}><span>Labour Cost</span><span>₹{live.labour.toFixed(2)}</span></div>
                        <div className={styles.previewRow}><span>Design Extra Fee</span><span>₹{live.design.toFixed(2)}</span></div>
                        <div className={styles.previewRow}><span>True Base Cost</span><span>₹{live.trueCost.toFixed(2)}</span></div>
                        <div className={styles.previewRowTotal}><span>Calculated Selling Price</span><span>₹{(live.sellingPrice / 100).toFixed(2)}</span></div>
                        <div className={styles.previewRowTotal} style={{ color: 'var(--orange)', borderTop: 'none', padding: 0 }}>
                          <span>Grand Total (incl. GST)</span>
                          <span>₹{(live.total / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={isSubmitting || weight <= 0 || printTime <= 0}
                    >
                      {isSubmitting ? 'Calculating & Sending Quote…' : 'Send Quote to Customer →'}
                    </button>
                  </form>
                )}

                {/* Fulfillment / Progress updates (Ordered, Printing, Shipped status) */}
                {['ordered', 'printing', 'shipped'].includes(selectedReq.status) && (
                  <div className={styles.fulfillmentForm}>
                    <h3 className={styles.formTitle}>Fulfillment Controls</h3>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                      {selectedReq.status === 'ordered' && (
                        <button
                          onClick={() => handleUpdateStatus('printing')}
                          className={styles.statusActionBtn}
                          style={{ background: '#8B5CF6' }}
                          disabled={isSubmitting}
                        >
                          ⚙️ Start Printing
                        </button>
                      )}
                      
                      {['ordered', 'printing'].includes(selectedReq.status) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360, marginTop: 10 }}>
                          <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>TRACKING NUMBER (REQUIRED FOR SHIPPING)</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="text"
                              className={styles.trackingInput}
                              placeholder="e.g. IN123456789"
                              value={trackingNum}
                              onChange={e => setTrackingNum(e.target.value)}
                              disabled={isSubmitting}
                            />
                            <button
                              onClick={() => handleUpdateStatus('shipped')}
                              className={styles.statusActionBtn}
                              style={{ background: '#0EA5E9' }}
                              disabled={isSubmitting || !trackingNum.trim()}
                            >
                              🚚 Ship Order
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedReq.status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateStatus('delivered')}
                          className={styles.statusActionBtn}
                          style={{ background: '#10B981' }}
                          disabled={isSubmitting}
                        >
                          ✅ Mark Delivered
                        </button>
                      )}
                    </div>

                    {/* Admin/Design Notes (updates user dashboard) */}
                    <div className={styles.formField} style={{ marginTop: 20 }}>
                      <label>Design Team Notes (Visible to Customer)</label>
                      <textarea
                        rows={4}
                        placeholder="Provide progress updates, file notes, or questions for the customer..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        disabled={isSubmitting}
                        style={{ width: '100%', background: 'var(--ink)', color: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: 12, boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={handleSaveNotesOnly}
                        className={styles.saveNotesBtn}
                        disabled={isSubmitting}
                      >
                        Save Notes Only
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyDetail}>Select a custom request to view details and proceed.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
