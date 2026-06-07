import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/layout/SEO'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { Upload, X, HelpCircle, FileText, CheckCircle2, ArrowLeft, Banknote, Hourglass, Settings, Package, PartyPopper, CheckCircle, MapPin } from 'lucide-react'
import { fmt } from '../lib/formatters'
import styles from './CustomPrint.module.css'

const CUSTOM_STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  requested: { label: 'Awaiting Quote', color: '#94A3B8', icon: <Hourglass size={18} />, desc: 'Our team is reviewing your description and files to calculate print and design costs.' },
  quoted:    { label: 'Quote Ready',    color: '#FF5C1A', icon: <Banknote size={18} />, desc: 'We have compiled a pricing quote for your request. You can check out below.' },
  ordered:   { label: 'Paid & Queued',  color: '#3B82F6', icon: <CheckCircle size={18} />, desc: 'Payment received. Your order is secured and has been placed in our print queue.' },
  printing:  { label: 'Crafting Now',   color: '#8B5CF6', icon: <Settings size={18} />, desc: 'Your custom design is currently running on our precision 3D printers.' },
  shipped:   { label: 'Shipped',        color: '#0EA5E9', icon: <Package size={18} />, desc: 'Your handcrafted piece has been dispatched. Track your delivery below.' },
  delivered: { label: 'Delivered',      color: '#10B981', icon: <PartyPopper size={18} />, desc: 'Delivered successfully! Enjoy your custom 3D printed creation.' },
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById('razorpay-script')) return resolve(true)
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CustomPrint() {
  useScrollReveal()
  const navigate = useNavigate()
  const { customPrintId } = useParams<{ customPrintId?: string }>()

  // Mutations/Queries
  const createRequest = useMutation(api.customPrints.createCustomPrintRequest)
  const updateRequest = useMutation(api.customPrints.updateCustomPrintRequest)
  const uploadFile = useAction(api.cloudinary.uploadCustomPrintFile)
  const addresses = useQuery(api.addresses.getMyAddresses)
  const preparePayment = useAction(api.customPrints.prepareCustomPrintPayment)

  // Fetch detail if param is present
  const customPrint = useQuery(
    api.customPrints.getCustomPrintById,
    customPrintId ? { customPrintId } : 'skip'
  )

  // Form states
  const [description, setDescription] = useState('')
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [assignedId, setAssignedId] = useState('')

  // Payment states
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Initialize fields if editing
  useEffect(() => {
    if (customPrint) {
      setDescription(customPrint.description)
      setExistingImages(customPrint.images || [])
    }
  }, [customPrint])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [customPrintId])

  // Common add files routine
  const addFiles = (selectedFiles: File[]) => {
    setError('')
    const totalCurrentCount = existingImages.length + files.length
    
    // Check limit
    if (totalCurrentCount + selectedFiles.length > 3) {
      setError('You can upload a maximum of 3 reference images.')
      return
    }

    // Validate MIME types and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid format: ${file.name}. Only JPEG, PNG, and WebP are allowed.`)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is 10MB.`)
        return
      }
    }

    setFiles(prev => [...prev, ...selectedFiles])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    addFiles(Array.from(e.target.files))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  // Submit form (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Please provide a description of your print request.')
      return
    }

    setIsSubmitting(true)
    setIsUploading(true)
    setError('')

    try {
      const uploadedUrls: string[] = []
      
      // Upload new queued files
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(Math.round((i / files.length) * 100))
        
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(files[i])
          reader.onload = () => {
            const result = reader.result as string
            const base64 = result.split(',')[1]
            resolve(base64)
          }
          reader.onerror = error => reject(error)
        })

        const url = await uploadFile({
          base64Data,
          fileName: files[i].name,
          fileType: files[i].type,
        })
        uploadedUrls.push(url)
      }
      setUploadProgress(100)
      setIsUploading(false)

      const finalImages = [...existingImages, ...uploadedUrls]

      if (customPrintId) {
        // Edit Mode
        await updateRequest({
          customPrintId,
          description,
          images: finalImages,
        })
        setSuccess(true)
        setAssignedId(customPrintId)
      } else {
        // Create Mode
        const newId = await createRequest({
          description,
          images: finalImages,
        })
        setSuccess(true)
        setAssignedId(newId)
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to submit request.')
      setIsUploading(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Razorpay Pay
  const handlePay = async () => {
    if (!customPrint || !customPrint.pricing) return

    const addrId = selectedAddressId || (addresses && addresses.find(a => a.isDefault)?._id) || (addresses && addresses[0]?._id)

    if (!addrId) {
      setPaymentError('Please select a delivery address or add one to your profile.')
      return
    }

    const selectedAddr = addresses?.find(a => a._id === addrId)
    if (!selectedAddr) return

    setPaymentLoading(true)
    setPaymentError('')

    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        throw new Error('Could not load payment gateway. Check your connection.')
      }

      const rzpOrder = await preparePayment({
        customPrintId: customPrint.customPrintId,
        address: {
          name: selectedAddr.name,
          line1: selectedAddr.line1,
          line2: selectedAddr.line2 || undefined,
          city: selectedAddr.city,
          state: selectedAddr.state,
          pincode: selectedAddr.pincode,
          phone: selectedAddr.phone,
        }
      })

      const rzp = new window.Razorpay({
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'BWR Works',
        description: `Custom Print ${customPrint.customPrintId}`,
        image: '/logo.png',
        order_id: rzpOrder.razorpayOrderId,
        prefill: { name: selectedAddr.name, contact: selectedAddr.phone },
        theme: { color: '#FF5C1A' },
        modal: { ondismiss: () => setPaymentLoading(false) },
        handler: () => {
          // Success
          window.location.reload()
        }
      })
      rzp.open()
    } catch (err: any) {
      console.error(err)
      setPaymentError(err?.message || 'Payment initiation failed.')
      setPaymentLoading(false)
    }
  }

  // Loading spinner for details
  if (customPrintId && customPrint === undefined) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingScreen}>
          <div className={styles.spinner} />
          <span>Loading request specifications...</span>
        </div>
      </div>
    )
  }

  // Handle Request Not Found
  if (customPrintId && customPrint === null) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.container} style={{ textAlign: 'center', maxWidth: '600px', padding: '160px 20px' }}>
          <SEO title="Request Not Found | BWR Works" description="No custom print request exists with this ID." />
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Request Not Found</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>We couldn't locate any custom print request under the ID "{customPrintId}". It might have been deleted or doesn't belong to your account.</p>
          <button onClick={() => navigate('/dashboard')} className={styles.submitBtn}>Back to Dashboard</button>
        </div>
        <Footer />
      </div>
    )
  }

  const isEditMode = !!customPrintId
  const isReadOnly = customPrint ? !['requested', 'quoted'].includes(customPrint.status) : false
  const meta = customPrint ? CUSTOM_STATUS_META[customPrint.status] : null

  return (
    <div className={styles.page}>
      <SEO 
        title={isEditMode ? `Request ${customPrintId} Details | BWR Works` : "Request a Custom 3D Print | BWR Works"} 
        description="Submit design specs and reference photos for a custom unique 3D print. Precision crafted in Bengaluru."
      />
      <Navbar />

      <div className={styles.container}>
        {/* Navigation & Header */}
        <div className={styles.header}>
          <Link to="/dashboard" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          
          <div className="section-eyebrow reveal" style={{ color: 'var(--orange)', marginTop: '24px' }}>
            {isEditMode ? `CUSTOM REQUEST DETAILS` : 'CUSTOM FABRICATION'}
          </div>
          
          <h1 className={`${styles.title} reveal reveal-delay-1`}>
            {isEditMode ? (
              <>Request <span className={styles.outline}>{customPrintId}</span></>
            ) : (
              <>Request a <span className={styles.outline}>Unique Print</span></>
            )}
          </h1>
          
          {!isEditMode && (
            <p className={`${styles.subtitle} reveal reveal-delay-2`}>
              Have an idea that isn't in our standard collection? Tell us what you want printed. 
              Upload photos, sketch images, or 3D model screenshots, and our team will design and craft it for you.
            </p>
          )}
        </div>

        <div className={styles.layout}>
          {/* SUCCESS SCREEN */}
          {success ? (
            <div className={`${styles.successCard} page-enter`}>
              <div className={styles.successIcon}><CheckCircle2 size={48} /></div>
              <h2 className={styles.successTitle}>
                {isEditMode ? 'Request Updated Successfully' : 'Request Submitted Successfully'}
              </h2>
              <p className={styles.successText}>
                We have registered your custom specifications under ID: <strong>{assignedId}</strong>. 
                Our design team will review your requirements and coordinate.
              </p>
              <div className={styles.successBox}>
                <h4>What Happens Next:</h4>
                <ol>
                  <li>Our team reviews the description and reference images.</li>
                  <li>We estimate material, print hours, and assembly time to compile a pricing quote.</li>
                  <li>You will receive an email quote with a checkout link to pay and start fabrication.</li>
                </ol>
              </div>
              <button 
                onClick={() => navigate('/dashboard')} 
                className={styles.dashboardBtn}
              >
                Go to Dashboard →
              </button>
            </div>
          ) : (
            <>
              {/* LEFT COLUMN: Request Specifications / Form */}
              <div className={styles.formSection}>
                {isReadOnly ? (
                  /* Read Only Specs */
                  <div className={styles.readOnlyBlock}>
                    <h3 className={styles.blockTitle}>Specifications Submitted</h3>
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>DESCRIPTION</span>
                      <p className={styles.specText}>{customPrint?.description}</p>
                    </div>

                    {customPrint?.images && customPrint.images.length > 0 && (
                      <div className={styles.specRow} style={{ marginTop: '24px' }}>
                        <span className={styles.specLabel}>REFERENCE PHOTOS ({customPrint.images.length})</span>
                        <div className={styles.readOnlyImages}>
                          {customPrint.images.map((img, idx) => (
                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className={styles.imgLink}>
                              <img src={img} alt="reference" className={styles.specImg} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Edit / Create Form */
                  <form className={styles.form} onSubmit={handleSubmit}>
                    {error && (
                      <div className={styles.errorBox}>
                        <span>⚠️ {error}</span>
                      </div>
                    )}

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Describe what you need printed *</label>
                      <textarea
                        required
                        rows={6}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Specify colors, dimensions, function, and other details. For example: 'A customized headphone stand with the letters BWR engraved on the base. Matte white color, about 20cm height...'"
                        disabled={isSubmitting}
                        className={styles.textarea}
                      />
                    </div>

                    {/* Image uploads */}
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Reference Photos / Images (Optional, max 3)</label>
                      
                      {/* Grid of existing/queued images */}
                      {(existingImages.length > 0 || files.length > 0) && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {/* Existing Images */}
                          {existingImages.map((img, idx) => (
                            <div key={`existing-${idx}`} className={styles.thumbWrapper}>
                              <img src={img} alt="existing preview" className={styles.thumbImage} />
                              <button
                                type="button"
                                className={styles.thumbRemove}
                                onClick={() => removeExistingImage(idx)}
                                disabled={isSubmitting}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}

                          {/* New Files Queued */}
                          {files.map((file, idx) => {
                            const localUrl = URL.createObjectURL(file)
                            return (
                              <div key={`file-${idx}`} className={styles.thumbWrapper}>
                                <img src={localUrl} alt="new preview" className={styles.thumbImage} />
                                <button
                                  type="button"
                                  className={styles.thumbRemove}
                                  onClick={() => removeFile(idx)}
                                  disabled={isSubmitting}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Dropzone */}
                      {existingImages.length + files.length < 3 && (
                        <div 
                          className={`${styles.dropzone} ${isSubmitting ? styles.dropzoneDisabled : ''}`}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                          <input 
                            type="file" 
                            id="file-upload"
                            multiple 
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                            className={styles.fileInput}
                          />
                          <label htmlFor="file-upload" className={styles.dropzoneLabel}>
                            <Upload size={28} className={styles.uploadIcon} />
                            <span>Drag & drop images here or <span className={styles.browseLink}>browse files</span></span>
                            <span className={styles.formats}>JPEG, PNG or WebP (Max 10MB per file)</span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Upload progress */}
                    {isUploading && (
                      <div className={styles.progressContainer}>
                        <div className={styles.progressLabel}>
                          <span>Uploading images to cloud...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                      <button
                        type="submit"
                        className={styles.submitBtn}
                        style={{ flex: 1 }}
                        disabled={isSubmitting || (description.trim() === '')}
                      >
                        {isSubmitting ? 'Saving...' : isEditMode ? 'Save Specifications' : 'Submit Request →'}
                      </button>
                      
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard')}
                          className={styles.cancelBtn}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* RIGHT COLUMN: Status, Timeline & Payments */}
              <div className={styles.infoSection}>
                {customPrint ? (
                  /* Custom Print Detail Panel */
                  <div className={styles.infoCard}>
                    {/* Status Display */}
                    <div className={styles.statusBlock}>
                      <span className={styles.label}>Request Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                        <div className={styles.statusBadge} style={{ background: meta?.color + '20', color: meta?.color, borderColor: meta?.color + '40', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {meta?.icon} {meta?.label}
                        </div>
                      </div>
                      <p className={styles.statusDesc}>{meta?.desc}</p>
                    </div>

                    {/* Admin Notes */}
                    {customPrint.adminNotes && (
                      <div className={styles.adminNotesBlock}>
                        <span className={styles.label} style={{ color: 'var(--orange)' }}>Design Team Notes</span>
                        <p className={styles.adminNotesText}>{customPrint.adminNotes}</p>
                      </div>
                    )}

                    {/* Tracking details */}
                    {customPrint.trackingNumber && (
                      <div className={styles.trackingBlock}>
                        <span className={styles.label}>Consignment Tracking</span>
                        <div className={styles.trackingBox}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>TRACKING ID</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--orange)' }}>{customPrint.trackingNumber}</div>
                        </div>
                      </div>
                    )}

                    {/* Paid details for in-production orders */}
                    {['ordered', 'printing', 'shipped', 'delivered'].includes(customPrint.status) && (
                      <div className={styles.paidBlock}>
                        <span className={styles.label}>Payment Information</span>
                        <div className={styles.pricingSummary} style={{ marginTop: '10px' }}>
                          <div className={styles.priceRow}>
                            <span>Amount Paid</span>
                            <strong>{customPrint.pricing ? fmt(customPrint.pricing.total) : '—'}</strong>
                          </div>
                          <div className={styles.priceRow} style={{ border: 'none', padding: 0, marginTop: '8px', color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                            <span>TRANSACTION ID</span>
                            <span>{customPrint.razorpayPaymentId || 'Verified via webhook'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quotation & Address selection checkout for quoted orders */}
                    {customPrint.status === 'quoted' && customPrint.pricing && (
                      <div className={styles.checkoutBlock}>
                        <h4 className={styles.checkoutTitle}>Checkout Quote</h4>
                        <div className={styles.pricingSummary}>
                          <div className={styles.priceRow}>
                            <span>Subtotal (Design + Fabricate)</span>
                            <span>{fmt(customPrint.pricing.subtotal)}</span>
                          </div>
                          <div className={styles.priceRow}>
                            <span>GST (18%)</span>
                            <span>{fmt(customPrint.pricing.gstAmount)}</span>
                          </div>
                          <div className={`${styles.priceRow} ${styles.priceTotal}`}>
                            <span>Total Payable</span>
                            <strong>{fmt(customPrint.pricing.total)}</strong>
                          </div>
                        </div>

                        {/* Delivery Address Selector */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                          <label className={styles.label}>Delivery Address</label>
                          {addresses && addresses.length > 0 ? (
                            <select
                              value={selectedAddressId || (addresses.find(a => a.isDefault)?._id) || addresses[0]._id}
                              onChange={e => setSelectedAddressId(e.target.value)}
                              className={styles.addressSelect}
                              disabled={paymentLoading}
                            >
                              {addresses.map(a => (
                                <option key={a._id} value={a._id}>
                                  {a.name} - {a.line1}, {a.city}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className={styles.noAddressBox}>
                              <MapPin size={18} />
                              <span>No saved addresses found. Please add a shipping address in your <Link to="/dashboard?tab=profile" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>Dashboard Profile</Link> first.</span>
                            </div>
                          )}
                        </div>

                        {paymentError && (
                          <div className={styles.paymentError}>
                            ⚠️ {paymentError}
                          </div>
                        )}

                        <button
                          onClick={handlePay}
                          disabled={paymentLoading || !addresses || addresses.length === 0}
                          className={styles.payBtn}
                        >
                          {paymentLoading ? 'Connecting...' : 'Pay & Order Now →'}
                        </button>
                      </div>
                    )}

                    {/* Timeline Tracker */}
                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px', marginTop: '24px' }}>
                      <span className={styles.label} style={{ marginBottom: '16px', display: 'block' }}>Production Steps</span>
                      <div className={styles.timeline}>
                        {['requested', 'quoted', 'ordered', 'printing', 'shipped', 'delivered'].map((step, idx) => {
                          const steps = ['requested', 'quoted', 'ordered', 'printing', 'shipped', 'delivered']
                          const currentIdx = steps.indexOf(customPrint.status)
                          const isDone = idx <= currentIdx
                          const isCurrent = idx === currentIdx

                          const labels: Record<string, string> = {
                            requested: 'Request Submitted',
                            quoted: 'Design Quoted',
                            ordered: 'Order Queued',
                            printing: 'Fabricating / 3D Printing',
                            shipped: 'Shipped',
                            delivered: 'Delivered',
                          }

                          return (
                            <div key={step} className={`${styles.timelineStep} ${isDone ? styles.timelineDone : ''} ${isCurrent ? styles.timelineCurrent : ''}`}>
                              <div className={styles.timelineDot}>
                                {isDone && <CheckCircle size={14} />}
                              </div>
                              <div className={styles.timelineContent}>
                                <div className={styles.timelineLabel}>{labels[step]}</div>
                              </div>
                              {idx < 5 && <div className={styles.timelineLine} />}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Create Mode Info Card (How it works) */
                  <div className={styles.infoCard}>
                    <h3 className={styles.infoTitle}>BWR Custom Prints</h3>
                    <p className={styles.infoText}>
                      Our fabrication lab operates a fleet of high-precision core-XY printers. 
                      Every custom piece undergoes thorough design validation to ensure printability and optimal structural strength.
                    </p>

                    <div className={styles.features}>
                      <div className={styles.featureItem}>
                        <div className={styles.featureIcon}><HelpCircle size={18} /></div>
                        <div>
                          <h5>How is pricing calculated?</h5>
                          <p>We do not guess prices. We calculate costs based on material weight, print hours, and assembly time, then add our standard margin and custom configuration fee.</p>
                        </div>
                      </div>

                      <div className={styles.featureItem}>
                        <div className={styles.featureIcon}><FileText size={18} /></div>
                        <div>
                          <h5>What design files do we accept?</h5>
                          <p>You don't need a 3D model! We accept reference pictures, hand-drawn sketches, or textual descriptions. We'll build the 3D model in-house.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
