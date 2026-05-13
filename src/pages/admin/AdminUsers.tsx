import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './AdminPages.module.css'

export default function AdminUsers() {
  const users = useQuery(api.users.getAllWithStats)

  if (users === undefined) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Users</h1>
        </div>
        <div className={styles.loading}>Loading users...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users ({users.length})</h1>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Total Orders</th>
              <th>Total Revenue</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.name || '-'}</td>
                <td>{u.email || '-'}</td>
                <td>{u._creationTime ? new Date(u._creationTime).toLocaleDateString() : '-'}</td>
                <td>{u.totalOrders}</td>
                <td>₹{((u.totalRevenue || 0) / 100).toFixed(2)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${u.role === 'admin' ? styles.statusVerified : styles.statusPending}`}>
                    {u.role || 'user'}
                  </span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
