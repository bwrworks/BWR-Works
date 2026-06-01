import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { PenLine } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

import { useToast } from '../../context/ToastContext'
import styles from './ReviewSection.module.css'

interface Props {
  productId: Id<'products'>
}

function StarDisplay({ rating, size = '1rem' }: { rating: number; size?: string }) {
  return (
    <span className={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? styles.starFilled : styles.starEmpty} style={{ fontSize: size }}>
          ★
        </span>
      ))}
    </span>
  )
}

export default function ReviewSection({ productId }: Props) {
  const reviews = useQuery(api.reviews.getProductReviews, { productId })
  const ratingData = useQuery(api.reviews.getAverageRating, { productId })
  const submitReview = useMutation(api.reviews.submitReview)
  const { success, error: toastError } = useToast()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Check if user is logged in (we can infer from whether the mutation is available)
  // We'll attempt submission and handle auth error gracefully

  const handleSubmit = async () => {
    if (rating === 0) {
      toastError('Please select a star rating.')
      return
    }
    if (!reviewText.trim()) {
      toastError('Please write a review.')
      return
    }
    setSubmitting(true)
    try {
      await submitReview({ productId, rating, reviewText: reviewText.trim() })
      success('Review submitted! Thank you 🎉')
      setRating(0)
      setReviewText('')
      setShowForm(false)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.section}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <h2 className={styles.title}>Customer Reviews</h2>
        {ratingData && ratingData.count > 0 && (
          <div className={styles.summary}>
            <span className={styles.avgScore}>{ratingData.avg}</span>
            <div>
              <StarDisplay rating={Math.round(ratingData.avg)} />
              <div className={styles.reviewCount}>
                {ratingData.count} review{ratingData.count !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── REVIEW LIST ── */}
      {reviews && reviews.length > 0 ? (
        <div className={styles.reviewList}>
          {reviews.map(r => (
            <div key={r._id} className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <div className={styles.reviewerInfo}>
                  <div className={styles.reviewerAvatar}>
                    {r.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.reviewerName}>{r.userName}</div>
                    <div className={styles.reviewDate}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className={styles.reviewStars}>
                  <StarDisplay rating={r.rating} size="0.85rem" />
                </div>
              </div>
              <p className={styles.reviewText}>{r.reviewText}</p>
            </div>
          ))}
        </div>
      ) : reviews && (
        <div className={styles.emptyReviews}>
          <span><PenLine size={16} /></span>
          Be the first to review this product!
        </div>
      )}

      {/* ── WRITE REVIEW ── */}
      {!showForm ? (
        <button
          type="button"
          className={styles.submitBtn}
          onClick={() => setShowForm(true)}
          style={{ width: '100%', padding: '16px', borderRadius: 12 }}
        >
          <PenLine size={18} /> Write a Review
        </button>
      ) : (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Share Your Experience</h3>

          {/* Star picker */}
          <div className={styles.starPicker}>
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                className={`${styles.starPickerBtn} ${i <= (hoverRating || rating) ? styles.starPickerBtnActive : ''}`}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${i} star${i !== 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>

          {/* Text area */}
          <textarea
            className={styles.formTextarea}
            placeholder="What did you think of this product?"
            value={reviewText}
            onChange={e => setReviewText(e.target.value.slice(0, 500))}
            maxLength={500}
          />

          <div className={styles.formFooter}>
            <span className={styles.charHint}>{reviewText.length}/500</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={styles.submitBtn}
                style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(17,17,17,0.12)' }}
                onClick={() => { setShowForm(false); setRating(0); setReviewText('') }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={submitting || rating === 0 || !reviewText.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
