import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatPrice } from '../../lib/formatters'
import styles from './PricingCalculator.module.css'

// ═══════════════════════════════════════════════════
// BWR WORKS — Admin Pricing Calculator
// Section 1: Global Cost Defaults
// Section 2: Per-Product Pricing Cards (live breakdown)
// Section 3: Price Preview Table
// Backend engine lives in convex/pricing.ts
// ═══════════════════════════════════════════════════

interface Toast { message: string; type: 'success' | 'error' }

interface GlobalDefaults {
  materialCostPerKg: number
  electricityCostPerHour: number
  machineDepreciationPerHour: number
  consumablesPercent: number
  labourCostPerHour: number
  defaultPackagingCost: number
  overheadsCost: number
  riskBufferPercent: number
  b2cMarginPercent: number
  gstPercent: number
  b2bMarginSlabs: { minQty: number; maxQty: number; marginPercent: number }[]
}

interface ProductParams {
  materialWeightGrams: number
  printTimeMinutes: number
  labourTimeMinutes: number
  designCostOneTime: number
  designCostAmortizeQty: number
  packagingCost: string // optional override — empty = use default
}

/** Mirrors the formula in convex/pricing.ts exactly so we get live preview */
function calculateLive(defaults: GlobalDefaults, p: ProductParams) {
  const material = (p.materialWeightGrams / 1000) * defaults.materialCostPerKg
  const electricity = (p.printTimeMinutes / 60) * defaults.electricityCostPerHour
  const machine = (p.printTimeMinutes / 60) * defaults.machineDepreciationPerHour
  const consumables = material * (defaults.consumablesPercent / 100)
  const design = p.designCostAmortizeQty > 0 ? p.designCostOneTime / p.designCostAmortizeQty : 0
  const labour = (p.labourTimeMinutes / 60) * defaults.labourCostPerHour
  const packaging = p.packagingCost !== '' ? Number(p.packagingCost) : defaults.defaultPackagingCost
  const overheads = defaults.overheadsCost
  const subtotalCost = material + electricity + machine + consumables + design + labour + packaging + overheads
  const riskBuffer = subtotalCost * (defaults.riskBufferPercent / 100)
  const trueCost = subtotalCost + riskBuffer
  const margin = trueCost * (defaults.b2cMarginPercent / 100)
  const sellingPrice = trueCost + margin

  return {
    material, electricity, machine, consumables, design,
    labour, packaging, overheads, subtotalCost, riskBuffer,
    trueCost, margin, sellingPrice,
    b2bPrices: defaults.b2bMarginSlabs.map(s => ({
      label: `${s.minQty}–${s.maxQty === 99999 ? '∞' : s.maxQty} units`,
      price: trueCost * (1 + s.marginPercent / 100),
    })),
  }
}

// ─── DEFAULT STATE ─────────────────────────────────
const DEFAULT_GLOBALS: GlobalDefaults = {
  materialCostPerKg: 1200,
  electricityCostPerHour: 8,
  machineDepreciationPerHour: 15,
  consumablesPercent: 12,
  labourCostPerHour: 200,
  defaultPackagingCost: 25,
  overheadsCost: 15,
  riskBufferPercent: 15,
  b2cMarginPercent: 60,
  gstPercent: 18,
  b2bMarginSlabs: [
    { minQty: 1, maxQty: 20, marginPercent: 50 },
    { minQty: 21, maxQty: 100, marginPercent: 37 },
    { minQty: 101, maxQty: 500, marginPercent: 27 },
    { minQty: 501, maxQty: 99999, marginPercent: 20 },
  ],
}

const DEFAULT_PRODUCT_PARAMS: ProductParams = {
  materialWeightGrams: 0,
  printTimeMinutes: 0,
  labourTimeMinutes: 0,
  designCostOneTime: 0,
  designCostAmortizeQty: 100,
  packagingCost: '',
}

export default function PricingCalculator() {
  const products = useQuery(api.products.listAll)
  const dbDefaults = useQuery(api.pricing.getPricingDefaults)
  const allPricing = useQuery(api.pricing.getAllProductPricingAdmin)

  const savePricingDefaults = useMutation(api.pricing.savePricingDefaults)
  const saveProductPricing = useMutation(api.pricing.saveProductPricing)
  const recalculateAll = useMutation(api.pricing.recalculateAllPrices)

  const [globals, setGlobals] = useState<GlobalDefaults>(DEFAULT_GLOBALS)
  const [productParams, setProductParams] = useState<Record<string, ProductParams>>({})
  const [savingGlobals, setSavingGlobals] = useState(false)
  const [savingProduct, setSavingProduct] = useState<string | null>(null)
  const [recalculating, setRecalculating] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  // Load existing DB values into state
  useEffect(() => {
    if (dbDefaults) {
      setGlobals({
        materialCostPerKg: dbDefaults.materialCostPerKg,
        electricityCostPerHour: dbDefaults.electricityCostPerHour,
        machineDepreciationPerHour: dbDefaults.machineDepreciationPerHour,
        consumablesPercent: dbDefaults.consumablesPercent,
        labourCostPerHour: dbDefaults.labourCostPerHour,
        defaultPackagingCost: dbDefaults.defaultPackagingCost,
        overheadsCost: dbDefaults.overheadsCost,
        riskBufferPercent: dbDefaults.riskBufferPercent,
        b2cMarginPercent: dbDefaults.b2cMarginPercent,
        gstPercent: dbDefaults.gstPercent,
        b2bMarginSlabs: dbDefaults.b2bMarginSlabs,
      })
    }
  }, [dbDefaults])

  // Load existing product pricing into state
  useEffect(() => {
    if (allPricing && products) {
      const map: Record<string, ProductParams> = {}
      for (const p of allPricing) {
        map[p.productId] = {
          materialWeightGrams: p.materialWeightGrams,
          printTimeMinutes: p.printTimeMinutes,
          labourTimeMinutes: p.labourTimeMinutes,
          designCostOneTime: p.designCostOneTime,
          designCostAmortizeQty: p.designCostAmortizeQty,
          packagingCost: p.packagingCost != null ? String(p.packagingCost) : '',
        }
      }
      setProductParams(prev => ({ ...DEFAULT_PRODUCT_PARAMS, ...map, ...prev.length ? prev : {} }))
      setProductParams(map)
    }
  }, [allPricing, products])

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function updateGlobal<K extends keyof GlobalDefaults>(key: K, value: GlobalDefaults[K]) {
    setGlobals(prev => ({ ...prev, [key]: value }))
  }

  function updateSlab(idx: number, field: 'marginPercent', value: number) {
    setGlobals(prev => ({
      ...prev,
      b2bMarginSlabs: prev.b2bMarginSlabs.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }))
  }

  function getParams(productId: string): ProductParams {
    return productParams[productId] ?? { ...DEFAULT_PRODUCT_PARAMS }
  }

  function updateParam(productId: string, field: keyof ProductParams, value: string | number) {
    setProductParams(prev => ({
      ...prev,
      [productId]: { ...getParams(productId), [field]: value },
    }))
  }

  async function handleSaveGlobals() {
    setSavingGlobals(true)
    try {
      await savePricingDefaults(globals)
      showToast('Global defaults saved!', 'success')
    } catch (e: any) {
      showToast(e.message || 'Failed to save', 'error')
    } finally {
      setSavingGlobals(false)
    }
  }

  async function handleSaveProduct(productId: string) {
    const p = getParams(productId)
    setSavingProduct(productId)
    try {
      await saveProductPricing({
        productId: productId as any,
        materialWeightGrams: Number(p.materialWeightGrams),
        printTimeMinutes: Number(p.printTimeMinutes),
        labourTimeMinutes: Number(p.labourTimeMinutes),
        designCostOneTime: Number(p.designCostOneTime),
        designCostAmortizeQty: Number(p.designCostAmortizeQty),
        packagingCost: p.packagingCost !== '' ? Number(p.packagingCost) : undefined,
      })
      showToast('Product pricing saved & applied!', 'success')
    } catch (e: any) {
      showToast(e.message || 'Failed to save', 'error')
    } finally {
      setSavingProduct(null)
    }
  }

  async function handleRecalculateAll() {
    setRecalculating(true)
    try {
      const result = await recalculateAll()
      showToast(`Recalculated ${(result as any).recalculated} products!`, 'success')
    } catch (e: any) {
      showToast(e.message || 'Recalculation failed', 'error')
    } finally {
      setRecalculating(false)
    }
  }

  if (products === undefined || dbDefaults === undefined) {
    return <div className={styles.loading}>Loading pricing engine…</div>
  }

  return (
    <div className={styles.page}>

      {/* ── STICKY HEADER ── */}
      <div className={styles.header}>
        <Link to="/" className={styles.backBtn}>← Back to Site</Link>
        <div className={styles.headerDivider} />
        <span className={styles.headerTitle}>Pricing Calculator</span>
        <div className={styles.headerSpacer} />
        <button
          className={styles.recalcBtn}
          onClick={handleRecalculateAll}
          disabled={recalculating}
        >
          {recalculating ? 'Recalculating…' : 'Recalculate All Prices'}
        </button>
      </div>

      <div className={styles.content}>

        {/* ═══════════════════════════════════════════
            SECTION 1: GLOBAL COST DEFAULTS
            ═══════════════════════════════════════════ */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Global Cost Defaults</div>
              <div className={styles.cardSubtitle}>
                These apply to all products unless overridden per-product
              </div>
            </div>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Material Cost (₹/kg)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.materialCostPerKg}
                onChange={e => updateGlobal('materialCostPerKg', Number(e.target.value))}
                placeholder="e.g. 1200"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Electricity (₹/hr)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.electricityCostPerHour}
                onChange={e => updateGlobal('electricityCostPerHour', Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Machine Depreciation (₹/hr)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.machineDepreciationPerHour}
                onChange={e => updateGlobal('machineDepreciationPerHour', Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Consumables (% of material)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.consumablesPercent}
                onChange={e => updateGlobal('consumablesPercent', Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Labour Cost (₹/hr)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.labourCostPerHour}
                onChange={e => updateGlobal('labourCostPerHour', Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Default Packaging (₹/unit)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.defaultPackagingCost}
                onChange={e => updateGlobal('defaultPackagingCost', Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Overheads (₹/unit)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.overheadsCost}
                onChange={e => updateGlobal('overheadsCost', Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Risk Buffer (%)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.riskBufferPercent}
                onChange={e => updateGlobal('riskBufferPercent', Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>B2C Margin (%)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.b2cMarginPercent}
                onChange={e => updateGlobal('b2cMarginPercent', Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>GST (%)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={globals.gstPercent}
                onChange={e => updateGlobal('gstPercent', Number(e.target.value))}
              />
            </div>
          </div>

          {/* B2B Volume Slabs */}
          <div style={{ marginTop: 28 }}>
            <div className={styles.cardTitle} style={{ marginBottom: 12 }}>
              B2B Volume Slabs
            </div>
            <table className={styles.slabsTable}>
              <thead>
                <tr>
                  <th>Min Qty</th>
                  <th>Max Qty</th>
                  <th>Margin %</th>
                  <th>Strategy</th>
                </tr>
              </thead>
              <tbody>
                {globals.b2bMarginSlabs.map((slab, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="number"
                        value={slab.minQty}
                        readOnly
                        style={{ background: '#f0f0f0', color: '#888', cursor: 'not-allowed' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={slab.maxQty === 99999 ? '∞' : slab.maxQty}
                        readOnly
                        style={{ background: '#f0f0f0', color: '#888', cursor: 'not-allowed' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={slab.marginPercent}
                        onChange={e => updateSlab(i, 'marginPercent', Number(e.target.value))}
                      />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)' }}>
                      {i === 0 ? 'Prototype / testing' : i === 1 ? 'Standard order' : i === 2 ? 'Long-term supply' : 'Retainer contract'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className={styles.saveBtn}
            onClick={handleSaveGlobals}
            disabled={savingGlobals}
          >
            {savingGlobals ? 'Saving…' : 'Save Global Defaults'}
          </button>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 2: PER-PRODUCT PRICING CARDS
            ═══════════════════════════════════════════ */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Per-Product Cost Parameters</div>
              <div className={styles.cardSubtitle}>
                Set material weight, print time, and labour per product. Live breakdown updates as you type.
              </div>
            </div>
          </div>

          {!dbDefaults && (
            <div className={styles.noDefaults}>
              Save Global Defaults first before setting per-product pricing.
            </div>
          )}

          <div className={styles.productsGrid}>
            {(products ?? []).map(product => {
              const p = getParams(product._id)
              const breakdown = dbDefaults ? calculateLive(globals, p) : null

              return (
                <div key={product._id} className={styles.productCard}>
                  <div className={styles.productCardHeader}>
                    <span className={styles.productCardName}>{product.name}</span>
                    <span className={styles.productCardCategory}>{product.category}</span>
                  </div>

                  <div className={styles.productCardBody}>
                    <div className={styles.productField}>
                      <label className={styles.productFieldLabel}>Material Weight (grams)</label>
                      <input
                        type="number"
                        className={styles.productFieldInput}
                        value={p.materialWeightGrams}
                        onChange={e => updateParam(product._id, 'materialWeightGrams', Number(e.target.value))}
                        placeholder="e.g. 20"
                      />
                    </div>
                    <div className={styles.productField}>
                      <label className={styles.productFieldLabel}>Print Time (minutes)</label>
                      <input
                        type="number"
                        className={styles.productFieldInput}
                        value={p.printTimeMinutes}
                        onChange={e => updateParam(product._id, 'printTimeMinutes', Number(e.target.value))}
                        placeholder="e.g. 25"
                      />
                    </div>
                    <div className={styles.productField}>
                      <label className={styles.productFieldLabel}>Labour Time (minutes)</label>
                      <input
                        type="number"
                        className={styles.productFieldInput}
                        value={p.labourTimeMinutes}
                        onChange={e => updateParam(product._id, 'labourTimeMinutes', Number(e.target.value))}
                        placeholder="e.g. 5"
                      />
                    </div>
                    <div className={styles.productField}>
                      <label className={styles.productFieldLabel}>Design Cost One-time (₹)</label>
                      <input
                        type="number"
                        className={styles.productFieldInput}
                        value={p.designCostOneTime}
                        onChange={e => updateParam(product._id, 'designCostOneTime', Number(e.target.value))}
                        placeholder="e.g. 500"
                      />
                    </div>
                    <div className={styles.productField}>
                      <label className={styles.productFieldLabel}>Amortize Over (units)</label>
                      <input
                        type="number"
                        className={styles.productFieldInput}
                        value={p.designCostAmortizeQty}
                        onChange={e => updateParam(product._id, 'designCostAmortizeQty', Number(e.target.value))}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div className={styles.productField}>
                      <label className={styles.productFieldLabel}>Packaging Override ₹ (blank = default)</label>
                      <input
                        type="number"
                        className={styles.productFieldInput}
                        value={p.packagingCost}
                        onChange={e => updateParam(product._id, 'packagingCost', e.target.value)}
                        placeholder={`Default: ₹${globals.defaultPackagingCost}`}
                      />
                    </div>

                    {/* Live cost breakdown */}
                    {breakdown && (
                      <div className={styles.breakdown}>
                        <div className={styles.breakdownTitle}>Live Cost Breakdown</div>
                        <div className={styles.breakdownRow}>
                          <span>Material</span>
                          <span className={styles.breakdownValue}>₹{breakdown.material.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                          <span>Electricity</span>
                          <span className={styles.breakdownValue}>₹{breakdown.electricity.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                          <span>Machine</span>
                          <span className={styles.breakdownValue}>₹{breakdown.machine.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                          <span>Consumables</span>
                          <span className={styles.breakdownValue}>₹{breakdown.consumables.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                          <span>Design (amort.)</span>
                          <span className={styles.breakdownValue}>₹{breakdown.design.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                          <span>Labour</span>
                          <span className={styles.breakdownValue}>₹{breakdown.labour.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                          <span>Packaging</span>
                          <span className={styles.breakdownValue}>₹{breakdown.packaging.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                          <span>Overheads</span>
                          <span className={styles.breakdownValue}>₹{breakdown.overheads.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                          <span>Risk Buffer ({globals.riskBufferPercent}%)</span>
                          <span className={styles.breakdownValue}>₹{breakdown.riskBuffer.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRowTotal}>
                          <span>TRUE COST</span>
                          <span>₹{breakdown.trueCost.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRowB2C}>
                          <span>B2C PRICE ({globals.b2cMarginPercent}%)</span>
                          <span>₹{breakdown.sellingPrice.toFixed(2)}</span>
                        </div>
                        {breakdown.b2bPrices.map((b, i) => (
                          <div key={i} className={styles.breakdownRow} style={{ fontSize: '0.58rem' }}>
                            <span>B2B {b.label}</span>
                            <span className={styles.breakdownValue}>₹{b.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      className={styles.productSaveBtn}
                      onClick={() => handleSaveProduct(product._id)}
                      disabled={savingProduct === product._id}
                    >
                      {savingProduct === product._id ? 'Saving…' : 'Save & Apply Price →'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 3: PRICE PREVIEW TABLE
            ═══════════════════════════════════════════ */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Live Price Preview</div>
              <div className={styles.cardSubtitle}>
                Current prices in the database — what customers see on the storefront
              </div>
            </div>
          </div>

          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>B2C Price</th>
                <th>B2B 1–20</th>
                <th>B2B 21–100</th>
                <th>B2B 100+</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map(product => {
                const pricing = (allPricing ?? []).find(pr => pr.productId === product._id)
                return (
                  <tr key={product._id}>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {product.category}
                    </td>
                    <td className={styles.priceB2C}>
                      {pricing ? formatPrice(pricing.calculatedB2CPrice) : '—'}
                    </td>
                    {[0, 1, 2].map(slabIdx => (
                      <td key={slabIdx} className={styles.priceB2B}>
                        {pricing?.calculatedB2BPrices?.[slabIdx]
                          ? formatPrice(pricing.calculatedB2BPrices[slabIdx].pricePerUnit)
                          : '—'}
                      </td>
                    ))}
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                      {product.stock}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
