import styles from '../../pages/Dashboard.module.css'

export function Avatar({ name, email }: { name?: string; email?: string }) {
  const initials = (name || email || 'U').split(/\s|@/)[0].slice(0, 2).toUpperCase()
  return (
    <div className={styles.avatar}>
      <span>{initials}</span>
    </div>
  )
}
