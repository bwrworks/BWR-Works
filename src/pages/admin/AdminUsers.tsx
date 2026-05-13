import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatPrice } from '../../lib/formatters'
import styles from './AdminDashboard.module.css'

type SortKey = 'name' | 'email' | 'totalOrders' | 'totalRevenue' | '_creationTime'
type SortDir = 'asc' | 'desc'

export default function AdminUsers() {
  const users = useQuery(api.users.getAllWithStats)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('_creationTime')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.toLowerCase().trim()
    let result = q
      ? users.filter(u =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        )
      : [...users]

    result.sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0

      switch (sortKey) {
        case 'name':
          av = (a.name || '').toLowerCase()
          bv = (b.name || '').toLowerCase()
          break
        case 'email':
          av = (a.email || '').toLowerCase()
          bv = (b.email || '').toLowerCase()
          break
        case 'totalOrders':
          av = a.totalOrders; bv = b.totalOrders; break
        case 'totalRevenue':
          av = a.totalRevenue; bv = b.totalRevenue; break
        case '_creationTime':
          av = a._creationTime; bv = b._creationTime; break
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [users, search, sortKey, sortDir])

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

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 400, padding: '10px 16px',
            fontFamily: 'var(--font-body)', fontSize: '0.85rem',
            background: 'rgba(245, 240, 232, 0.05)',
            border: '1px solid rgba(245, 240, 232, 0.12)',
            color: 'var(--off-white)', borderRadius: 8,
            outline: 'none',
          }}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Name{sortIcon('name')}
              </th>
              <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                Email{sortIcon('email')}
              </th>
              <th onClick={() => handleSort('_creationTime')} style={{ cursor: 'pointer' }}>
                Joined{sortIcon('_creationTime')}
              </th>
              <th onClick={() => handleSort('totalOrders')} style={{ cursor: 'pointer' }}>
                Orders{sortIcon('totalOrders')}
              </th>
              <th onClick={() => handleSort('totalRevenue')} style={{ cursor: 'pointer' }}>
                Revenue{sortIcon('totalRevenue')}
              </th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id}>
                <td>{u.name || '-'}</td>
                <td>{u.email || '-'}</td>
                <td>{u._creationTime ? new Date(u._creationTime).toLocaleDateString() : '-'}</td>
                <td>{u.totalOrders}</td>
                <td>{formatPrice(u.totalRevenue || 0)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${u.role === 'admin' ? styles.statusVerified : styles.statusPending}`}>
                    {u.role || 'user'}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  {search ? 'No users match your search' : 'No users found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
