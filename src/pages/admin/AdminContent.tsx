import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './AdminDashboard.module.css'

// ─────────────────────────────────────────────────
// Admin Content Page — Full CMS for site copy
// ─────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'hero',
    title: 'Homepage Hero',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' as const },
      { key: 'subheadline', label: 'Subheadline', type: 'text' as const },
      { key: 'cta_text', label: 'CTA Button Text', type: 'text' as const },
    ],
  },
  {
    id: 'about',
    title: 'About / The Craft',
    fields: [
      { key: 'title', label: 'Section Title', type: 'text' as const },
      { key: 'body', label: 'Body Text', type: 'textarea' as const },
      { key: 'tagline', label: 'Tagline', type: 'text' as const },
    ],
  },
  {
    id: 'footer',
    title: 'Footer Details',
    fields: [
      { key: 'address', label: 'Address Line', type: 'text' as const },
      { key: 'phone', label: 'Phone', type: 'text' as const },
      { key: 'email', label: 'Email', type: 'text' as const },
      { key: 'instagram', label: 'Instagram URL', type: 'text' as const },
    ],
  },
  {
    id: 'invoice',
    title: 'Invoice Details',
    fields: [
      { key: 'gstin', label: 'GSTIN Number', type: 'text' as const },
      { key: 'company_address', label: 'Company Address', type: 'text' as const },
      { key: 'contact_email', label: 'Contact Email', type: 'text' as const },
      { key: 'hsn_code', label: 'Default HSN Code', type: 'text' as const },
      { key: 'gst_enabled', label: 'Enable GST (true/false)', type: 'text' as const },
    ],
  },
  {
    id: 'announcements',
    title: 'Announcement Bar',
    fields: [
      { key: 'message', label: 'Banner Message', type: 'text' as const },
      { key: 'is_active', label: 'Show Banner (true/false)', type: 'text' as const },
    ],
  },
]

export default function AdminContent() {
  const allContent = useQuery(api.cms.getAll)
  const setContent = useMutation(api.cms.set)
  const [saving, setSaving] = useState<string | null>(null)
  const [dirty, setDirty] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const getVal = (section: string, key: string) => {
    const dirtyKey = `${section}:${key}`
    if (dirty[dirtyKey] !== undefined) return dirty[dirtyKey]
    const entry = allContent?.find((c) => c.section === section && c.key === key)
    return entry?.value || ''
  }

  const handleChange = (section: string, key: string, value: string) => {
    setDirty((prev) => ({ ...prev, [`${section}:${key}`]: value }))
    setSaved((prev) => ({ ...prev, [`${section}:${key}`]: false }))
  }

  const handleSave = async (section: string, key: string) => {
    const dirtyKey = `${section}:${key}`
    const value = dirty[dirtyKey]
    if (value === undefined) return
    setSaving(dirtyKey)
    try {
      await setContent({ section, key, value })
      setSaved((prev) => ({ ...prev, [dirtyKey]: true }))
      // Clear dirty state after save
      setDirty((prev) => {
        const next = { ...prev }
        delete next[dirtyKey]
        return next
      })
    } catch (err) {
      console.error('CMS save error:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleSaveSection = async (sectionId: string, fields: { key: string }[]) => {
    for (const field of fields) {
      const dirtyKey = `${sectionId}:${field.key}`
      if (dirty[dirtyKey] !== undefined) {
        await handleSave(sectionId, field.key)
      }
    }
  }

  if (!allContent) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>Loading CMS…</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Content Management</h1>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        {SECTIONS.map((section) => {
          const sectionDirty = section.fields.some((f) => dirty[`${section.id}:${f.key}`] !== undefined)
          return (
            <div
              key={section.id}
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-xl)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {section.title}
                </h3>
                {sectionDirty && (
                  <button
                    onClick={() => handleSaveSection(section.id, section.fields)}
                    style={{
                      padding: '6px 16px',
                      background: 'var(--orange)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    Save Section
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {section.fields.map((field) => {
                  const dirtyKey = `${section.id}:${field.key}`
                  const isDirty = dirty[dirtyKey] !== undefined
                  const isSaved = saved[dirtyKey]
                  const isSaving = saving === dirtyKey
                  return (
                    <div key={field.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                      <label
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.62rem',
                          letterSpacing: '0.08em',
                          color: 'var(--muted)',
                          width: 160,
                          textTransform: 'uppercase',
                          paddingTop: 10,
                          flexShrink: 0,
                        }}
                      >
                        {field.label}
                      </label>
                      <div style={{ flex: 1, position: 'relative' }}>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={getVal(section.id, field.key)}
                            onChange={(e) => handleChange(section.id, field.key, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                            rows={4}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${isDirty ? 'var(--orange)' : 'var(--line)'}`,
                              borderRadius: 4,
                              fontFamily: 'var(--font-body)',
                              fontSize: '0.82rem',
                              background: '#fff',
                              resize: 'vertical',
                            }}
                          />
                        ) : (
                          <input
                            value={getVal(section.id, field.key)}
                            onChange={(e) => handleChange(section.id, field.key, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${isDirty ? 'var(--orange)' : 'var(--line)'}`,
                              borderRadius: 4,
                              fontFamily: 'var(--font-body)',
                              fontSize: '0.82rem',
                              background: '#fff',
                            }}
                          />
                        )}
                        {isDirty && (
                          <button
                            onClick={() => handleSave(section.id, field.key)}
                            disabled={isSaving}
                            style={{
                              position: 'absolute',
                              right: 6,
                              top: 6,
                              padding: '3px 10px',
                              background: 'var(--ink)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 3,
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.55rem',
                              cursor: isSaving ? 'wait' : 'pointer',
                            }}
                          >
                            {isSaving ? '...' : 'Save'}
                          </button>
                        )}
                        {isSaved && !isDirty && (
                          <span
                            style={{
                              position: 'absolute',
                              right: 8,
                              top: 8,
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.6rem',
                              color: '#10B981',
                            }}
                          >
                            ✓ Saved
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
