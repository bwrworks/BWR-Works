import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/layout/SEO'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { Upload, X, HelpCircle, FileText, CheckCircle2 } from 'lucide-react'
import styles from './CustomPrint.module.css'

export default function CustomPrint() {
  useScrollReveal()
  const navigate = useNavigate()
  const createRequest = useMutation(api.customPrints.createCustomPrintRequest)
  const uploadFile = useAction(api.cloudinary.uploadCustomPrintFile)

  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [assignedId, setAssignedId] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selectedFiles = Array.from(e.target.files)
    addFiles(selectedFiles)
  }

  // Common add files routine
  const addFiles = (selectedFiles: File[]) => {
    setError('')
    
    // Check limit
    if (files.length + selectedFiles.length > 3) {
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

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    }
  }

  // Remove a file from queue
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Form submission
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
      
      // Upload each file to Cloudinary via backend action
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(Math.round(((i) / files.length) * 100))
        
        // Convert file to base64
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

      // Submit mutation
      const customPrintId = await createRequest({
        description,
        images: uploadedUrls,
      })

      setAssignedId(customPrintId)
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to submit custom print request.')
      setIsUploading(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <SEO 
        title="Request a Custom 3D Print | BWR Works" 
        description="Submit design specs and reference photos for a custom unique 3D print. Precision crafted in Bengaluru."
      />
      <Navbar />

      <div className={styles.container}>
        <div className={styles.header}>
          <div className="section-eyebrow reveal" style={{ color: 'var(--orange)' }}>CUSTOM FABRICATION</div>
          <h1 className={`${styles.title} reveal reveal-delay-1`}>
            Request a <span className={styles.outline}>Unique Print</span>
          </h1>
          <p className={`${styles.subtitle} reveal reveal-delay-2`}>
            Have an idea that isn't in our standard collection? Tell us what you want printed. 
            Upload photos, sketch images, or 3D model screenshots, and our team will design and craft it for you.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Success screen */}
          {success ? (
            <div className={`${styles.successCard} page-enter`}>
              <div className={styles.successIcon}><CheckCircle2 size={48} /></div>
              <h2 className={styles.successTitle}>Request Submitted Successfully</h2>
              <p className={styles.successText}>
                We have registered your custom print request under ID: <strong>{assignedId}</strong>. 
                An email confirmation has been sent to you.
              </p>
              <div className={styles.successBox}>
                <h4>Next Steps:</h4>
                <ol>
                  <li>Our designers will review your files and estimate material, print, and design time.</li>
                  <li>We will email you a pricing quote based on our cost engine.</li>
                  <li>You can review the quote and proceed to checkout under the "Custom Prints" tab in your account dashboard.</li>
                </ol>
              </div>
              <button 
                onClick={() => navigate('/dashboard?tab=custom-prints')} 
                className={styles.dashboardBtn}
              >
                Go to Dashboard →
              </button>
            </div>
          ) : (
            <>
              {/* Left: Request Form */}
              <div className={styles.formSection}>
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

                  {/* Dropzone */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Reference Photos / Images (Optional, max 3)</label>
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
                        <Upload size={32} className={styles.uploadIcon} />
                        <span>Drag & drop images here or <span className={styles.browseLink}>browse files</span></span>
                        <span className={styles.formats}>JPEG, PNG or WebP (Max 10MB per file)</span>
                      </label>
                    </div>
                  </div>

                  {/* Upload List */}
                  {files.length > 0 && (
                    <div className={styles.fileList}>
                      {files.map((file, idx) => {
                        const localUrl = URL.createObjectURL(file)
                        return (
                          <div key={idx} className={styles.fileItem}>
                            <img src={localUrl} alt="preview" className={styles.fileThumbnail} />
                            <div className={styles.fileMeta}>
                              <span className={styles.fileName}>{file.name}</span>
                              <span className={styles.fileSize}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => removeFile(idx)}
                              disabled={isSubmitting}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

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

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting || (description.trim() === '')}
                  >
                    {isSubmitting ? 'Submitting Request...' : 'Submit Request →'}
                  </button>
                </form>
              </div>

              {/* Right: How it Works details */}
              <div className={styles.infoSection}>
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
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
