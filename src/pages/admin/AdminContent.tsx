import styles from './AdminDashboard.module.css'

// ─────────────────────────────────────────────────
// Admin Content Page — CMS for site copy
// Currently a placeholder. Full CMS coming next.
// ─────────────────────────────────────────────────

const SECTIONS = [
  { id: 'hero', title: 'Homepage Hero', fields: ['Headline', 'Subheadline', 'CTA Button Text'] },
  { id: 'about', title: 'About / The Craft', fields: ['Section Title', 'Body Text', 'Tagline'] },
  { id: 'footer', title: 'Footer', fields: ['Address Line', 'Phone', 'Email', 'Instagram URL'] },
  { id: 'announcements', title: 'Announcement Bar', fields: ['Message', 'Is Active'] },
]

export default function AdminContent() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Content Management</h1>
        </div>
      </div>

      <div style={{ background: '#FFF8F5', border: '1px solid var(--orange)', borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--orange)', marginBottom: 8 }}>COMING SOON</div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--black-soft)', margin: 0, lineHeight: 1.6 }}>
          Full CMS editing is in development. For now, edit site content directly in the codebase. The sections below show what will be manageable from this panel.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        {SECTIONS.map(section => (
          <div key={section.id} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', opacity: 0.6 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 var(--space-md)' }}>{section.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {section.fields.map(field => (
                <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--muted)', width: 160, textTransform: 'uppercase' }}>{field}</label>
                  <input
                    disabled
                    placeholder="Editable soon..."
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: '0.82rem', background: '#F9FAFB', color: 'var(--muted)', cursor: 'not-allowed' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
