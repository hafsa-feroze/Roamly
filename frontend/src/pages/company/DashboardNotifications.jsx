import { useState, useEffect } from 'react'
import axios from 'axios'
import '../shared/DashboardNotifications.css'

const API_BASE_URL = 'http://localhost:8000'

function DashboardNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showDetailsPopup, setShowDetailsPopup] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const companyId = localStorage.getItem('user_id')
    if (!companyId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications?company_id=${companyId}`)
      if (response.data && response.data.notifications) {
        setNotifications(response.data.notifications)
        // Update parent component's notification count
        window.dispatchEvent(new CustomEvent('notificationCountUpdated', { 
          detail: response.data.count || 0 
        }))
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to load notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification)
    setShowDetailsPopup(true)
  }

  const handleCloseDetails = () => {
    setShowDetailsPopup(false)
    setSelectedNotification(null)
  }

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return
    }

    const companyId = localStorage.getItem('user_id')
    if (!companyId) {
      setError('Please log in to delete notifications')
      return
    }

    setDeletingId(notificationId)
    setError('')
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}?company_id=${companyId}`)
      // Refresh notifications list (this will also update the count)
      await fetchNotifications()
    } catch (err) {
      console.error('Error deleting notification:', err)
      setError(err.response?.data?.detail || 'Failed to delete notification. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="dashboard-notifications">

      {loading ? (
        <div className="loading-notifications">
          <p>Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="no-notifications">
          <p>No notifications yet. You'll see booking notifications here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div key={notification.notification_id} className="notification-card">
              <div className="notification-content">
                <div className="notification-message">
                  <span className="notification-icon" size="50">🔔</span>
                  <p>{notification.notification}</p>
                </div>
                <div className="notification-time">
                  {formatDate(notification.created_at)}
                </div>
              </div>
              <div className="notification-actions">
                <button
                  className="details-btn"
                  onClick={() => handleViewDetails(notification)}
                >
                  Details
                </button>
                <button
                  className="delete-notification-btn"
                  onClick={() => handleDelete(notification.notification_id)}
                  disabled={deletingId === notification.notification_id}
                >
                  {deletingId === notification.notification_id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Popup */}
      {showDetailsPopup && selectedNotification && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="close-btn" onClick={handleCloseDetails}>×</button>
            </div>
            <div className="modal-body">
              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">Customer Name:</span>
                  <span className="detail-value">{selectedNotification.booking_details.customer_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {selectedNotification.booking_details.resort_type === 'hotel' 
                      ? 'Number of Nights:' 
                      : 'Number of Tickets:'}
                  </span>
                  <span className="detail-value">{selectedNotification.booking_details.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Price:</span>
                  <span className="detail-value">${selectedNotification.booking_details.total_price.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Booking Date:</span>
                  <span className="detail-value">{formatDate(selectedNotification.booking_details.booking_date)}</span>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="close-details-btn"
                  onClick={handleCloseDetails}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardNotifications

