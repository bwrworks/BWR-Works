import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './AddressForm.module.css'

interface AddressData {
  name: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  phone: string
  isDefault: boolean
}

interface Props {
  onSave: (address: AddressData) => void
  onCancel?: () => void
  initial?: Partial<AddressData>
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh'
]

export default function AddressForm({ onSave, onCancel, initial = {} }: Props) {
  const saveAddress = useMutation(api.addresses.addAddress)

  const [form, setForm] = useState<AddressData>({
    name: initial.name || '',
    line1: initial.line1 || '',
    line2: initial.line2 || '',
    city: initial.city || '',
    state: initial.state || '',
    pincode: initial.pincode || '',
    phone: initial.phone || '',
    isDefault: initial.isDefault ?? false,
  })
  const [errors, setErrors] = useState<Partial<AddressData>>({})
  const [saving, setSaving] = useState(false)

  const validate = (): boolean => {
    const e: Partial<AddressData> = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.line1.trim()) e.line1 = 'Address line 1 is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state) e.state = 'State is required'
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await saveAddress({
        name: form.name.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode,
        phone: form.phone,
        isDefault: form.isDefault,
      })
      onSave(form)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const set = (field: keyof AddressData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Full Name *</label>
          <input
            id="addr-name"
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="As it should appear on the package"
          />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Phone Number *</label>
          <input
            id="addr-phone"
            className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            value={form.phone}
            onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile number"
            type="tel"
          />
          {errors.phone && <span className={styles.error}>{errors.phone}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Address Line 1 *</label>
        <input
          id="addr-line1"
          className={`${styles.input} ${errors.line1 ? styles.inputError : ''}`}
          value={form.line1}
          onChange={e => set('line1', e.target.value)}
          placeholder="Flat / House number, Building, Street"
        />
        {errors.line1 && <span className={styles.error}>{errors.line1}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Address Line 2 <span className={styles.optional}>(optional)</span></label>
        <input
          id="addr-line2"
          className={styles.input}
          value={form.line2}
          onChange={e => set('line2', e.target.value)}
          placeholder="Landmark, Area, Colony"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>City *</label>
          <input
            id="addr-city"
            className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
            value={form.city}
            onChange={e => set('city', e.target.value)}
            placeholder="City"
          />
          {errors.city && <span className={styles.error}>{errors.city}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Pincode *</label>
          <input
            id="addr-pincode"
            className={`${styles.input} ${errors.pincode ? styles.inputError : ''}`}
            value={form.pincode}
            onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit pincode"
          />
          {errors.pincode && <span className={styles.error}>{errors.pincode}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>State *</label>
        <select
          id="addr-state"
          className={`${styles.input} ${styles.select} ${errors.state ? styles.inputError : ''}`}
          value={form.state}
          onChange={e => set('state', e.target.value)}
        >
          <option value="">Select State</option>
          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.state && <span className={styles.error}>{errors.state}</span>}
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={e => set('isDefault', e.target.checked)}
          className={styles.checkbox}
          id="addr-default"
        />
        <span className={styles.checkboxLabel}>Set as default delivery address</span>
      </label>

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.btnCancel} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className={styles.btnSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  )
}
