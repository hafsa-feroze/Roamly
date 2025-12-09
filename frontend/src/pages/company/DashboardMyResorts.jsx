import { useState, useEffect } from 'react'
import axios from 'axios'
import '../shared/DashboardMyResorts.css'

const API_BASE_URL = 'http://localhost:8000'

function DashboardMyResorts() {
  const [showForm, setShowForm] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [editingResort, setEditingResort] = useState(null)
  const [resorts, setResorts] = useState([])
  const [loadingResorts, setLoadingResorts] = useState(true)
  const [bookingCount, setBookingCount] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    price: '',
    status: 'open',
    type: 'hotel',
    instagram_link: '',
    facebook_link: '',
    googlemap_link: ''
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [imageScale, setImageScale] = useState(1)
  const [initialImageScale, setInitialImageScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [updateFormData, setUpdateFormData] = useState({
    name: '',
    city: '',
    country: '',
    price: '',
    status: 'open',
    type: 'hotel',
    instagram_link: '',
    facebook_link: '',
    googlemap_link: ''
  })
  const [updateSelectedImage, setUpdateSelectedImage] = useState(null)
  const [updateImagePreview, setUpdateImagePreview] = useState(null)
  const [updateImagePosition, setUpdateImagePosition] = useState({ x: 0, y: 0 })
  const [updateImageScale, setUpdateImageScale] = useState(1)
  const [initialUpdateImageScale, setInitialUpdateImageScale] = useState(1)
  const [updateIsDragging, setUpdateIsDragging] = useState(false)
  const [updateDragStart, setUpdateDragStart] = useState({ x: 0, y: 0 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingResort, setDeletingResort] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [blogResort, setBlogResort] = useState(null)
  const [blogCaption, setBlogCaption] = useState('')
  const [blogImage, setBlogImage] = useState(null)
  const [blogImagePreview, setBlogImagePreview] = useState(null)
  const [blogLoading, setBlogLoading] = useState(false)
  const [blogError, setBlogError] = useState('')
  const [blogSuccess, setBlogSuccess] = useState('')

  // Fetch resorts on component mount and after adding a new resort
  const fetchResorts = async () => {
    const companyId = localStorage.getItem('user_id')
    if (!companyId) {
      setLoadingResorts(false)
      return
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/resorts-with-image?company_id=${companyId}`)
      if (response.data && response.data.resorts) {
        setResorts(response.data.resorts)
      }
    } catch (err) {
      console.error('Error fetching resorts:', err)
    } finally {
      setLoadingResorts(false)
    }
  }

  // Fetch booking count for the company
  const fetchBookingCount = async () => {
    const companyId = localStorage.getItem('user_id')
    if (!companyId) {
      return
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/count?company_id=${companyId}`)
      if (response.data && response.data.booking_count !== undefined) {
        setBookingCount(response.data.booking_count)
      }
    } catch (err) {
      console.error('Error fetching booking count:', err)
    }
  }

  useEffect(() => {
    fetchResorts()
    fetchBookingCount()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  // Calculate initial scale to fit image in preview
  const calculateInitialScale = (imageSrc, callback) => {
    const img = new Image()
    img.onload = () => {
      const previewWidth = 600 // Approximate preview container width
      const previewHeight = 350 // Frame height
      const imageAspect = img.width / img.height
      const previewAspect = previewWidth / previewHeight
      
      let initialScale
      if (imageAspect > previewAspect) {
        // Image is wider - fit to width
        initialScale = previewWidth / img.width
      } else {
        // Image is taller - fit to height
        initialScale = previewHeight / img.height
      }
      
      // Make sure entire image is visible (scale down a bit)
      initialScale = Math.min(initialScale * 0.95, 1)
      callback(initialScale)
    }
    img.src = imageSrc
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageSrc = reader.result
        setImagePreview(imageSrc)
        setImagePosition({ x: 0, y: 0 })
        calculateInitialScale(imageSrc, (scale) => {
          setImageScale(scale)
          setInitialImageScale(scale)
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUpdateSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageSrc = reader.result
        setUpdateImagePreview(imageSrc)
        setUpdateImagePosition({ x: 0, y: 0 })
        calculateInitialScale(imageSrc, (scale) => {
          setUpdateImageScale(scale)
          setInitialUpdateImageScale(scale)
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Crop image to frame area
  const cropImageToFrame = (imageSrc, position, scale, frameWidth, frameHeight, callback) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = frameWidth
      canvas.height = frameHeight
      const ctx = canvas.getContext('2d')
      
      // Image is transformed with: translate(calc(-50% + x), calc(-50% + y)) scale(s)
      // This means the image center is at (frameWidth/2 + x, frameHeight/2 + y)
      const imageCenterX = frameWidth / 2 + position.x
      const imageCenterY = frameHeight / 2 + position.y
      
      // Scaled image dimensions
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      
      // Find the intersection of the frame (0,0 to frameWidth,frameHeight) 
      // with the scaled image (centered at imageCenterX, imageCenterY)
      const imageLeft = imageCenterX - scaledWidth / 2
      const imageTop = imageCenterY - scaledHeight / 2
      const imageRight = imageLeft + scaledWidth
      const imageBottom = imageTop + scaledHeight
      
      // Visible area in frame coordinates
      const visibleLeft = Math.max(0, imageLeft)
      const visibleTop = Math.max(0, imageTop)
      const visibleRight = Math.min(frameWidth, imageRight)
      const visibleBottom = Math.min(frameHeight, imageBottom)
      
      // Convert visible area to original image coordinates
      const sourceX = (visibleLeft - imageLeft) / scale
      const sourceY = (visibleTop - imageTop) / scale
      const sourceWidth = (visibleRight - visibleLeft) / scale
      const sourceHeight = (visibleBottom - visibleTop) / scale
      
      // Destination in canvas
      const destX = visibleLeft
      const destY = visibleTop
      const destWidth = visibleRight - visibleLeft
      const destHeight = visibleBottom - visibleTop
      
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, frameWidth, frameHeight)
      
      // Draw the visible portion
      if (sourceWidth > 0 && sourceHeight > 0 && destWidth > 0 && destHeight > 0) {
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          destX,
          destY,
          destWidth,
          destHeight
        )
      }
      
      canvas.toBlob(callback, 'image/jpeg', 0.9)
    }
    img.src = imageSrc
  }

  // Image preview handlers for add form
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setImageScale(prev => Math.max(0.1, Math.min(3, prev + delta)))
  }

  // Image preview handlers for update form
  const handleUpdateMouseDown = (e) => {
    setUpdateIsDragging(true)
    setUpdateDragStart({ x: e.clientX - updateImagePosition.x, y: e.clientY - updateImagePosition.y })
  }

  const handleUpdateMouseMove = (e) => {
    if (updateIsDragging) {
      setUpdateImagePosition({
        x: e.clientX - updateDragStart.x,
        y: e.clientY - updateDragStart.y
      })
    }
  }

  const handleUpdateMouseUp = () => {
    setUpdateIsDragging(false)
  }

  const handleUpdateWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setUpdateImageScale(prev => Math.max(0.1, Math.min(3, prev + delta)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const companyId = localStorage.getItem('user_id')
    if (!companyId) {
      setError('Please log in to add a resort')
      setLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('company_id', companyId)
      formDataToSend.append('name', formData.name)
      formDataToSend.append('city', formData.city)
      formDataToSend.append('country', formData.country)
      formDataToSend.append('price', parseFloat(formData.price).toString())
      formDataToSend.append('status', formData.status)
      formDataToSend.append('type', formData.type)
      if (formData.instagram_link) {
        formDataToSend.append('instagram_link', formData.instagram_link)
      }
      if (formData.facebook_link) {
        formDataToSend.append('facebook_link', formData.facebook_link)
      }
      if (formData.googlemap_link) {
        formDataToSend.append('googlemap_link', formData.googlemap_link)
      }
      if (selectedImage && imagePreview) {
        // Crop image to frame before upload
        const frameWidth = 600 // Preview container width
        const frameHeight = 350 // Frame height
        await new Promise((resolve) => {
          cropImageToFrame(
            imagePreview,
            imagePosition,
            imageScale,
            frameWidth,
            frameHeight,
            (croppedBlob) => {
              const croppedFile = new File([croppedBlob], selectedImage.name, { type: 'image/jpeg' })
              formDataToSend.append('image', croppedFile)
              resolve()
            }
          )
        })
      }

      const response = await axios.post(
        `${API_BASE_URL}/resorts-with-image`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data) {
        setSuccess('Resort added successfully!')
        setFormData({
          name: '',
          city: '',
          country: '',
          price: '',
          status: 'open',
          type: 'hotel',
          instagram_link: '',
          facebook_link: '',
          googlemap_link: ''
        })
        setSelectedImage(null)
        setImagePreview(null)
        setImagePosition({ x: 0, y: 0 })
        setImageScale(1)
        // Refresh resorts list and booking count
        await fetchResorts()
        await fetchBookingCount()
        setTimeout(() => {
          setShowForm(false)
          setSuccess('')
        }, 2000)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add resort. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (resort) => {
    setEditingResort(resort)
    setUpdateFormData({
      name: resort.name,
      city: resort.city,
      country: resort.country,
      price: resort.price.toString(),
      status: resort.status,
      type: resort.type,
      instagram_link: resort.instagram_link || '',
      facebook_link: resort.facebook_link || '',
      googlemap_link: resort.googlemap_link || ''
    })
    setUpdateSelectedImage(null)
    setUpdateImagePreview(resort.image_name ? `${API_BASE_URL}/images/${resort.image_name}` : null)
    setUpdateImagePosition({ x: 0, y: 0 })
    setUpdateImageScale(1)
    setShowUpdateForm(true)
    setError('')
    setSuccess('')
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setUpdating(true)

    const companyId = localStorage.getItem('user_id')
    if (!companyId || !editingResort) {
      setError('Please log in to update a resort')
      setUpdating(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('company_id', companyId)
      
      // Only append fields that have changed
      if (updateFormData.name !== editingResort.name) formDataToSend.append('name', updateFormData.name)
      if (updateFormData.city !== editingResort.city) formDataToSend.append('city', updateFormData.city)
      if (updateFormData.country !== editingResort.country) formDataToSend.append('country', updateFormData.country)
      if (parseFloat(updateFormData.price) !== editingResort.price) formDataToSend.append('price', parseFloat(updateFormData.price).toString())
      if (updateFormData.status !== editingResort.status) formDataToSend.append('status', updateFormData.status)
      if (updateFormData.type !== editingResort.type) formDataToSend.append('type', updateFormData.type)
      
      // Handle link fields - always send them (empty string if not provided)
      const currentInstagram = editingResort.instagram_link || ''
      const currentFacebook = editingResort.facebook_link || ''
      const currentGoogleMap = editingResort.googlemap_link || ''
      if (updateFormData.instagram_link !== currentInstagram) {
        formDataToSend.append('instagram_link', updateFormData.instagram_link || '')
      }
      if (updateFormData.facebook_link !== currentFacebook) {
        formDataToSend.append('facebook_link', updateFormData.facebook_link || '')
      }
      if (updateFormData.googlemap_link !== currentGoogleMap) {
        formDataToSend.append('googlemap_link', updateFormData.googlemap_link || '')
      }
      
      if (updateSelectedImage && updateImagePreview) {
        // Crop image to frame before upload
        const frameWidth = 600 // Preview container width
        const frameHeight = 350 // Frame height
        await new Promise((resolve) => {
          cropImageToFrame(
            updateImagePreview,
            updateImagePosition,
            updateImageScale,
            frameWidth,
            frameHeight,
            (croppedBlob) => {
              const croppedFile = new File([croppedBlob], updateSelectedImage.name, { type: 'image/jpeg' })
              formDataToSend.append('image', croppedFile)
              resolve()
            }
          )
        })
      }

      const response = await axios.put(
        `${API_BASE_URL}/resorts-with-image/${editingResort.resort_id}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data) {
        setSuccess('Resort updated successfully!')
        setUpdateSelectedImage(null)
        setUpdateImagePreview(null)
        setUpdateImagePosition({ x: 0, y: 0 })
        setUpdateImageScale(1)
        // Refresh resorts list and booking count
        await fetchResorts()
        await fetchBookingCount()
        setTimeout(() => {
          setShowUpdateForm(false)
          setEditingResort(null)
          setSuccess('')
        }, 2000)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update resort. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateChange = (e) => {
    setUpdateFormData({
      ...updateFormData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleDeleteClick = (resort) => {
    setDeletingResort(resort)
    setShowDeleteConfirm(true)
    setError('')
    setSuccess('')
  }

  const handleAddBlogClick = (resort) => {
    setBlogResort(resort)
    setBlogCaption('')
    setBlogImage(null)
    setBlogImagePreview(null)
    setBlogError('')
    setBlogSuccess('')
    setShowBlogForm(true)
  }

  const handleBlogImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBlogImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBlogImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBlogSubmit = async (e) => {
    e.preventDefault()
    setBlogLoading(true)
    setBlogError('')
    setBlogSuccess('')

    const companyId = localStorage.getItem('user_id')
    if (!companyId || !blogResort) {
      setBlogError('Please log in to add a blog')
      setBlogLoading(false)
      return
    }

    if (!blogCaption.trim()) {
      setBlogError('Caption is required')
      setBlogLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('company_id', companyId)
      formDataToSend.append('resort_id', blogResort.resort_id)
      formDataToSend.append('caption', blogCaption.trim())
      if (blogImage) {
        formDataToSend.append('image', blogImage)
      }

      const response = await axios.post(
        `${API_BASE_URL}/blogs`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data) {
        setBlogSuccess('Blog added successfully!')
        setBlogCaption('')
        setBlogImage(null)
        setBlogImagePreview(null)
        setTimeout(() => {
          setShowBlogForm(false)
          setBlogSuccess('')
        }, 2000)
      }
    } catch (err) {
      setBlogError(err.response?.data?.detail || 'Failed to add blog. Please try again.')
    } finally {
      setBlogLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingResort) return

    setDeleting(true)
    setError('')
    setSuccess('')

    const companyId = localStorage.getItem('user_id')
    if (!companyId) {
      setError('Please log in to delete a resort')
      setDeleting(false)
      return
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/resorts-with-image/${deletingResort.resort_id}?company_id=${companyId}`
      )

      if (response.data) {
        setSuccess('Resort deleted successfully!')
        // Refresh resorts list and booking count
        await fetchResorts()
        await fetchBookingCount()
        setTimeout(() => {
          setShowDeleteConfirm(false)
          setDeletingResort(null)
          setSuccess('')
        }, 1500)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete resort. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setDeletingResort(null)
    setError('')
    setSuccess('')
  }

  const companyName = localStorage.getItem('user_name') || 'Company'

  return (
    <div className="dashboard-resorts">
      {/* Company Name */}
      <div className="company-name-section">
        <h1 className="company-name">{companyName}</h1>
      </div>

      {/* Resort Statistics */}
      <div className="resorts-stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>Total Resorts</h3>
            <p className="stat-value">{resorts.length}</p>
          </div>
          <div className="stat-item">
            <h3>Active Listings</h3>
            <p className="stat-value">{resorts.filter(r => r.status === 'open' || r.status === 'not full').length}</p>
          </div>
          <div className="stat-item">
            <h3>Total Bookings</h3>
            <p className="stat-value">{bookingCount}</p>
          </div>
        </div>
      </div>

      {/* Add Resort Button */}
      <div className="add-resort-section">
        <button 
          className="add-resort-btn"
          onClick={() => {
            setShowForm(true)
            setError('')
            setSuccess('')
          }}
        >
          + Add New Resort
        </button>
      </div>

      {/* Update Resort Form Modal */}
      {showUpdateForm && editingResort && (
        <div className="modal-overlay" onClick={() => {
          setShowUpdateForm(false)
          setEditingResort(null)
          setError('')
          setSuccess('')
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Resort</h2>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateSubmit} className="resort-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update-name">Resort Name *</label>
                    <input
                      type="text"
                      id="update-name"
                      name="name"
                      value={updateFormData.name}
                      onChange={handleUpdateChange}
                      required
                      placeholder="Enter resort name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="update-city">City *</label>
                    <input
                      type="text"
                      id="update-city"
                      name="city"
                      value={updateFormData.city}
                      onChange={handleUpdateChange}
                      required
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update-country">Country *</label>
                    <input
                      type="text"
                      id="update-country"
                      name="country"
                      value={updateFormData.country}
                      onChange={handleUpdateChange}
                      required
                      placeholder="Enter country"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="update-type">Resort Type *</label>
                    <select
                      id="update-type"
                      name="type"
                      value={updateFormData.type}
                      onChange={handleUpdateChange}
                      required
                    >
                      <option value="hotel">Hotel</option>
                      <option value="adventure">Adventure</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update-price">
                      {updateFormData.type === 'hotel' ? 'Price (per night) *' : 'Ticket Price *'}
                    </label>
                    <input
                      type="number"
                      id="update-price"
                      name="price"
                      value={updateFormData.price}
                      onChange={handleUpdateChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Enter price"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="update-status">Status *</label>
                    <select
                      id="update-status"
                      name="status"
                      value={updateFormData.status}
                      onChange={handleUpdateChange}
                      required
                    >
                      <option value="open">Open</option>
                      <option value="not full">Not Full</option>
                      <option value="full">Full</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update-instagram_link">Instagram Link</label>
                    <input
                      type="url"
                      id="update-instagram_link"
                      name="instagram_link"
                      value={updateFormData.instagram_link}
                      onChange={handleUpdateChange}
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="update-facebook_link">Facebook Link</label>
                    <input
                      type="url"
                      id="update-facebook_link"
                      name="facebook_link"
                      value={updateFormData.facebook_link}
                      onChange={handleUpdateChange}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update-googlemap_link">Google Maps Link</label>
                    <input
                      type="url"
                      id="update-googlemap_link"
                      name="googlemap_link"
                      value={updateFormData.googlemap_link}
                      onChange={handleUpdateChange}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update-image">Resort Image</label>
                    <input
                      type="file"
                      id="update-image"
                      name="image"
                      accept="image/*"
                      onChange={handleUpdateImageChange}
                    />
                    {(updateImagePreview || (editingResort && editingResort.image_name)) && (
                      <div className="image-preview-container">
                        <div className="image-preview-frame">
                          <div 
                            className="image-preview-wrapper"
                            onMouseDown={handleUpdateMouseDown}
                            onMouseMove={handleUpdateMouseMove}
                            onMouseUp={handleUpdateMouseUp}
                            onMouseLeave={handleUpdateMouseUp}
                            onWheel={handleUpdateWheel}
                            style={{ cursor: updateIsDragging ? 'grabbing' : 'grab' }}
                          >
                            <img 
                              src={updateImagePreview || `${API_BASE_URL}/images/${editingResort.image_name}`}
                              alt="Preview" 
                              style={{
                                transform: `translate(calc(-50% + ${updateImagePosition.x}px), calc(-50% + ${updateImagePosition.y}px)) scale(${updateImageScale})`,
                                transition: updateIsDragging ? 'none' : 'transform 0.1s ease-out'
                              }}
                            />
                          </div>
                          <div className="crop-overlay">
                            <div className="crop-frame"></div>
                          </div>
                        </div>
                        <div className="image-preview-controls">
                          <div className="preview-instructions">
                            <p>📌 Drag to position • 🔍 Scroll to zoom • Frame shows visible area</p>
                          </div>
                          <div className="zoom-controls">
                            <button 
                              type="button"
                              onClick={() => setUpdateImageScale(prev => Math.max(0.1, prev - 0.1))}
                              className="zoom-btn"
                            >
                              −
                            </button>
                            <span className="zoom-level">{Math.round(updateImageScale * 100)}%</span>
                            <button 
                              type="button"
                              onClick={() => setUpdateImageScale(prev => Math.min(3, prev + 0.1))}
                              className="zoom-btn"
                            >
                              +
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setUpdateImagePosition({ x: 0, y: 0 })
                                setUpdateImageScale(initialUpdateImageScale)
                              }}
                              className="reset-btn"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button"
                    className="cancel-resort-btn"
                    onClick={() => {
                      setShowUpdateForm(false)
                      setEditingResort(null)
                      setError('')
                      setSuccess('')
                      setUpdateImagePreview(null)
                      setUpdateImagePosition({ x: 0, y: 0 })
                      setUpdateImageScale(1)
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-resort-btn"
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Update Resort'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Resort Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => {
          setShowForm(false)
          setError('')
          setSuccess('')
          setSelectedImage(null)
          setImagePreview(null)
          setImagePosition({ x: 0, y: 0 })
          setImageScale(1)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Resort</h2>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="resort-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Resort Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter resort name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      placeholder="Enter country"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">Resort Type *</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="hotel">Hotel</option>
                      <option value="adventure">Adventure</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">
                      {formData.type === 'hotel' ? 'Price (per night) *' : 'Ticket Price *'}
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Enter price"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="open">Open</option>
                      <option value="not full">Not Full</option>
                      <option value="full">Full</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="instagram_link">Instagram Link</label>
                    <input
                      type="url"
                      id="instagram_link"
                      name="instagram_link"
                      value={formData.instagram_link}
                      onChange={handleChange}
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="facebook_link">Facebook Link</label>
                    <input
                      type="url"
                      id="facebook_link"
                      name="facebook_link"
                      value={formData.facebook_link}
                      onChange={handleChange}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="googlemap_link">Google Maps Link</label>
                    <input
                      type="url"
                      id="googlemap_link"
                      name="googlemap_link"
                      value={formData.googlemap_link}
                      onChange={handleChange}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="image">Resort Image</label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="image-preview-container">
                        <div className="image-preview-frame">
                          <div 
                            className="image-preview-wrapper"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                          >
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              style={{
                                transform: `translate(calc(-50% + ${imagePosition.x}px), calc(-50% + ${imagePosition.y}px)) scale(${imageScale})`,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                              }}
                            />
                          </div>
                          <div className="crop-overlay">
                            <div className="crop-frame"></div>
                          </div>
                        </div>
                        <div className="image-preview-controls">
                          <div className="preview-instructions">
                            <p>📌 Drag to position • 🔍 Scroll to zoom • Frame shows visible area</p>
                          </div>
                          <div className="zoom-controls">
                            <button 
                              type="button"
                              onClick={() => setImageScale(prev => Math.max(0.1, prev - 0.1))}
                              className="zoom-btn"
                            >
                              −
                            </button>
                            <span className="zoom-level">{Math.round(imageScale * 100)}%</span>
                            <button 
                              type="button"
                              onClick={() => setImageScale(prev => Math.min(3, prev + 0.1))}
                              className="zoom-btn"
                            >
                              +
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setImagePosition({ x: 0, y: 0 })
                                setImageScale(initialImageScale)
                              }}
                              className="reset-btn"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button"
                    className="cancel-resort-btn"
                    onClick={() => {
                      setShowForm(false)
                      setError('')
                      setSuccess('')
                      setFormData({
                        name: '',
                        city: '',
                        country: '',
                        price: '',
                        status: 'open',
                        type: 'hotel',
                        instagram_link: '',
                        facebook_link: '',
                        googlemap_link: ''
                      })
                      setSelectedImage(null)
                      setImagePreview(null)
                      setImagePosition({ x: 0, y: 0 })
                      setImageScale(1)
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-resort-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Resort'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Blog Form Modal */}
      {showBlogForm && blogResort && (
        <div className="modal-overlay" onClick={() => {
          setShowBlogForm(false)
          setBlogError('')
          setBlogSuccess('')
          setBlogCaption('')
          setBlogImage(null)
          setBlogImagePreview(null)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Blog for {blogResort.name}</h2>
            </div>
            <div className="modal-body">
              <form onSubmit={handleBlogSubmit} className="resort-form">
                {blogError && <div className="error-message">{blogError}</div>}
                {blogSuccess && <div className="success-message">{blogSuccess}</div>}

                <div className="form-row">
                  <div className="form-group" style={{width: '100%'}}>
                    <label htmlFor="blog-caption">Caption *</label>
                    <textarea
                      id="blog-caption"
                      name="caption"
                      value={blogCaption}
                      onChange={(e) => setBlogCaption(e.target.value)}
                      required
                      placeholder="Write your blog caption..."
                      rows="5"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{width: '100%'}}>
                    <label htmlFor="blog-image">Image (Optional)</label>
                    <input
                      type="file"
                      id="blog-image"
                      name="image"
                      accept="image/*"
                      onChange={handleBlogImageChange}
                    />
                    {blogImagePreview && (
                      <div style={{marginTop: '1rem'}}>
                        <img 
                          src={blogImagePreview} 
                          alt="Preview" 
                          style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: '6px',
                            border: '1px solid #ddd'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button"
                    className="cancel-resort-btn"
                    onClick={() => {
                      setShowBlogForm(false)
                      setBlogError('')
                      setBlogSuccess('')
                      setBlogCaption('')
                      setBlogImage(null)
                      setBlogImagePreview(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-resort-btn"
                    disabled={blogLoading}
                  >
                    {blogLoading ? 'Adding...' : 'Add Blog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingResort && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              {!success && (
                <>
                  <p className="delete-confirm-text">
                    Are you sure you want to delete <strong>"{deletingResort.name}"</strong>?
                  </p>
                  <p className="delete-warning">This action cannot be undone.</p>
                  <div className="modal-actions">
                    <button 
                      type="button"
                      className="cancel-resort-btn"
                      onClick={handleDeleteCancel}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      className="confirm-delete-btn"
                      onClick={handleDeleteConfirm}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resort Cards */}
      <div className="resorts-list-section">
        {loadingResorts ? (
          <p className="loading-resorts">Loading resorts...</p>
        ) : resorts.length === 0 ? (
          <p className="no-resorts">No resorts found. Add your first resort to get started.</p>
        ) : (
              <div className="resorts-grid">
                {resorts.map((resort) => (
                  <div key={resort.resort_id} className="resort-card">
                    {resort.image_name && (
                      <div className="resort-card-image">
                        <img 
                          src={`${API_BASE_URL}/images/${resort.image_name}`} 
                          alt={resort.name}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <br></br>
                    <div className="resort-card-header">
                      <h3 >{resort.name}</h3>
                      <span className={`status-badge status-${resort.status.replace(' ', '-')}`}>
                        {resort.status}
                      </span>
                    </div>
                    <div className="resort-card-body">
                      <div className="resort-info">
                        {resort.company_name && (
                          <p className="resort-company">
                            <span className="icon">🏢</span>
                            {resort.company_name}
                          </p>
                        )}
                        <p className="resort-location">
                          <span className="icon">📍</span>
                          {resort.city}, {resort.country}
                        </p>
                        <p className="resort-type">
                          <span className="icon">🏨</span>
                          {resort.type.charAt(0).toUpperCase() + resort.type.slice(1)}
                        </p>
                      </div>
                      <div className="resort-price">
                        <span className="price-label">
                          {resort.type === 'hotel' ? 'Price per night:' : 'Ticket price:'}
                        </span>
                        <span className="price-value">${resort.price.toFixed(2)}</span>
                      </div>
                      {(resort.instagram_link || resort.facebook_link || resort.googlemap_link) && (
                        <div className="resort-social-links">
                          {resort.instagram_link && (
                            <a 
                              href={resort.instagram_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="social-link instagram-link"
                              title="Instagram"
                            >
                              📷 Instagram
                            </a>
                          )}
                          {resort.facebook_link && (
                            <a 
                              href={resort.facebook_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="social-link facebook-link"
                              title="Facebook"
                            >
                              👥 Facebook
                            </a>
                          )}
                          {resort.googlemap_link && (
                            <a 
                              href={resort.googlemap_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="social-link googlemap-link"
                              title="Google Maps"
                            >
                              🗺️ Location
                            </a>
                          )}
                        </div>
                      )}
                      <div className="resort-actions">
                        <button 
                          className="update-resort-btn"
                          onClick={() => handleEditClick(resort)}
                        >
                          Update
                        </button>
                        <button 
                          className="add-blog-btn"
                          onClick={() => handleAddBlogClick(resort)}
                        >
                          Add Blog
                        </button>
                        <button 
                          className="delete-resort-btn"
                          onClick={() => handleDeleteClick(resort)}
                          title="Delete resort"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  )
}

export default DashboardMyResorts

