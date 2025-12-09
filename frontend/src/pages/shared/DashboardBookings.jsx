import { useState, useEffect } from 'react'
import axios from 'axios'
import './DashboardBookings.css'

const API_BASE_URL = 'http://localhost:8000'

function DashboardBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    const userId = localStorage.getItem('user_id')
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/user?user_id=${userId}`)
      if (response.data && response.data.bookings) {
        setBookings(response.data.bookings)
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Failed to load bookings. Please try again.')
    } finally {
      setLoading(false)
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

  // Separate bookings into future and past
  const futureBookings = bookings.filter(booking => !booking.is_past)
  const pastBookings = bookings.filter(booking => booking.is_past)

  return (
    <div className="dashboard-bookings">

      {loading ? (
        <div className="loading-bookings">
          <p>Loading bookings...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="bookings-two-column">
          {/* Future Bookings Column */}
          <div className="bookings-column">
            <h2 className="column-title">Current Bookings</h2>
            {futureBookings.length === 0 ? (
              <p className="no-bookings">No upcoming bookings.</p>
            ) : (
              <div className="bookings-list">
                {futureBookings.map((booking) => (
                  <div key={booking.booking_id} className="booking-card">
                    <div className="booking-card-content">
                      <div className="booking-main-info">
                        <div className="booking-title-row">
                          
                          <h2>{booking.resort_name}</h2>
                        </div>
                        <p className="booking-company">by {booking.company_name}</p>
                        <p className="booking-location">📍 {booking.city}, {booking.country}</p>
                        <p className="booking-date">Booking Date: {formatDate(booking.booking_date)}</p>
                      </div>
                      <div className="booking-details">
                        <div className="booking-detail-item">
                          <span className="detail-label">
                            {booking.resort_type === 'hotel' ? 'Nights: ' : 'Tickets: '}
                            <span className="detail-value">{booking.quantity}</span>
                          </span>
                         
                        </div>
                        <div className="booking-detail-item">
                          <span className="detail-label">Total</span>
                          <span className="detail-value price">${booking.total_price.toFixed(2)}</span>
                        </div>
                        {booking.pdf_filename && (
                          <div className="booking-detail-item">
                            <a
                              className="pdf-view-btn"
                              href={`${API_BASE_URL}/pdfs/${booking.pdf_filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View PDF
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Bookings Column */}
          <div className="bookings-column">
            <h2 className="column-title">Booking History</h2>
            {pastBookings.length === 0 ? (
              <p className="no-bookings">No past bookings.</p>
            ) : (
              <div className="bookings-list">
                {pastBookings.map((booking) => (
                  <div key={booking.booking_id} className="booking-card past-booking">
                    <div className="booking-card-content">
                      <div className="booking-main-info">
                        <div className="booking-title-row">
                          <span className="booking-icon">🏨</span>
                          <h3>{booking.resort_name}</h3>
                        </div>
                        <p className="booking-company">by {booking.company_name}</p>
                        <p className="booking-location">📍 {booking.city}, {booking.country}</p>
                        <p className="booking-date">{formatDate(booking.booking_date)}</p>
                      </div>
                      <div className="booking-details">
                        <div className="booking-detail-item">
                          <span className="detail-label">
                            {booking.resort_type === 'hotel' ? 'Nights' : 'Tickets'}
                          </span>
                          <span className="detail-value">{booking.quantity}</span>
                        </div>
                        <div className="booking-detail-item">
                          <span className="detail-label">Total</span>
                          <span className="detail-value price">${booking.total_price.toFixed(2)}</span>
                        </div>
                        {booking.pdf_filename && (
                          <div className="booking-detail-item">
                            <a
                              className="pdf-view-btn"
                              href={`${API_BASE_URL}/pdfs/${booking.pdf_filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View PDF
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardBookings

