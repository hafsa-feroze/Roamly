import { useState, useEffect } from 'react'
import axios from 'axios'
import '../shared/DashboardHome.css'

const API_BASE_URL = 'http://localhost:8000'

function DashboardHome() {
  const userName = localStorage.getItem('user_name')
  const userType = localStorage.getItem('user_type')
  const [showCountryPopup, setShowCountryPopup] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [resorts, setResorts] = useState([])
  const [loadingResorts, setLoadingResorts] = useState(false)
  const [showBookingPopup, setShowBookingPopup] = useState(false)
  const [selectedResort, setSelectedResort] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [showDetailsPopup, setShowDetailsPopup] = useState(false)
  const [detailsResort, setDetailsResort] = useState(null)
  const [resortBlogs, setResortBlogs] = useState([])
  const [loadingBlogs, setLoadingBlogs] = useState(false)
  // Add state for the resort search
  const [resortSearch, setResortSearch] = useState('')

  // List of countries (can be fetched from backend later)
  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'France',
    'Germany', 'Italy', 'Spain', 'Japan', 'India', 'Thailand', 'Malaysia',
    'Singapore', 'Dubai', 'Turkey', 'Greece', 'Portugal', 'Brazil', 'Mexico',
    'Switzerland', 'Netherlands', 'Belgium', 'Austria', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Poland', 'Czech Republic', 'Hungary', 'Romania',
    'South Korea', 'China', 'Indonesia', 'Philippines', 'Vietnam', 'Cambodia',
    'Myanmar', 'Sri Lanka', 'Nepal', 'Bangladesh', 'Pakistan', 'Egypt',
    'Morocco', 'South Africa', 'Kenya', 'Tanzania', 'Zimbabwe', 'Botswana',
    'New Zealand', 'Fiji', 'Tahiti', 'Maldives', 'Seychelles', 'Mauritius'
  ]

  // Filter countries based on search input
  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  )

  // Filter resorts according to the search text
  const filteredResorts = resorts.filter(r => {
    const query = resortSearch.trim().toLowerCase()
    if (!query) return true
    return (
      r.name?.toLowerCase().includes(query) ||
      r.city?.toLowerCase().includes(query) ||
      r.company_name?.toLowerCase().includes(query)
    )
  })

  const handleCountryInputChange = (e) => {
    setCountrySearch(e.target.value)
    setShowDropdown(true)
    if (!e.target.value) {
      setSelectedCountry('')
    }
  }

  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
    setCountrySearch(country)
    setShowDropdown(false)
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.country-input-wrapper')) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleExploreResorts = async () => {
    if (!countrySearch.trim()) return
    const finalCountry = selectedCountry || countrySearch.trim()
    setSelectedCountry(finalCountry)
    setShowCountryPopup(false)
    setShowDropdown(false)
    
    // Fetch resorts by country from backend
    setLoadingResorts(true)
    try {
      const response = await axios.get(
        `${API_BASE_URL}/resorts-with-image?country=${encodeURIComponent(finalCountry)}`
      )
      if (response.data && response.data.resorts) {
        setResorts(response.data.resorts)
      }
    } catch (err) {
      console.error('Error fetching resorts:', err)
      setResorts([])
    } finally {
      setLoadingResorts(false)
    }
  }

  const handleViewDetails = async (resort) => {
    setDetailsResort(resort)
    setShowDetailsPopup(true)
    setLoadingBlogs(true)
    setResortBlogs([])
    
    // Fetch blogs for this resort
    try {
      const response = await axios.get(`${API_BASE_URL}/blogs?resort_id=${resort.resort_id}`)
      if (response.data && response.data.blogs) {
        setResortBlogs(response.data.blogs)
      }
    } catch (err) {
      console.error('Error fetching blogs:', err)
    } finally {
      setLoadingBlogs(false)
    }
  }

  const handleCloseDetailsPopup = () => {
    setShowDetailsPopup(false)
    setDetailsResort(null)
    setResortBlogs([])
  }

  const handleBookResort = (resort) => {
    setSelectedResort(resort)
    setBookingDate('')
    setQuantity(1)
    setBookingError('')
    setBookingSuccess('')
    setShowBookingPopup(true)
  }

  const handleCloseBookingPopup = () => {
    setShowBookingPopup(false)
    setSelectedResort(null)
    setBookingDate('')
    setQuantity(1)
    setBookingError('')
    setBookingSuccess('')
  }

  const calculateTotalPrice = () => {
    if (!selectedResort) return 0
    return selectedResort.price * quantity
  }

  const handleSubmitBooking = async () => {
    if (!bookingDate) {
      setBookingError('Please select a booking date')
      return
    }
    
    if (quantity <= 0) {
      setBookingError('Quantity must be greater than 0')
      return
    }

    setBookingError('')
    setIsBooking(true)

    try {
      const userId = localStorage.getItem('user_id')
      if (!userId) {
        setBookingError('User not logged in')
        setIsBooking(false)
        return
      }

      const response = await axios.post(
        `${API_BASE_URL}/bookings?user_id=${userId}`,
        {
          resort_id: selectedResort.resort_id,
          booking_date: bookingDate,
          quantity: quantity
        }
      )

      if (response.data) {
        setBookingSuccess('Booking successful!')
        setTimeout(() => {
          handleCloseBookingPopup()
          // Optionally refresh resorts list
        }, 2000)
      }
    } catch (err) {
      console.error('Error creating booking:', err)
      setBookingError(
        err.response?.data?.detail || 'Failed to create booking. Please try again.'
      )
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="dashboard-home">
      <div className="welcome-section">
        <h1 className="welcome-title">
          {userName 
            ? `Welcome back, ${userName}!`
            : 'Welcome to Roamly!'
          }
        </h1>
      </div>

      {/* Country Selection Popup */}
      {showCountryPopup && (
        <div className="modal-overlay" onClick={() => setShowDropdown(false)}>
          <div className="modal-content country-select-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Your Destination</h2>
            </div>
            <div className="modal-body">
              <p className="country-select-label">
                Choose a country to explore available resorts and adventures
              </p>
              <div className="country-select-group">
                <label htmlFor="country-input">Country *</label>
                <div className="country-input-wrapper">
                  <input
                    id="country-input"
                    type="text"
                    className="country-input"
                    value={countrySearch}
                    onChange={handleCountryInputChange}
                    onFocus={handleInputFocus}
                    placeholder="Type or select a country..."
                    autoComplete="off"
                  />
                  <span className="country-input-icon">🌍</span>
                  {showDropdown && filteredCountries.length > 0 && (
                    <div className="country-dropdown">
                      {filteredCountries.map((country) => (
                        <div
                          key={country}
                          className={`country-option ${selectedCountry === country ? 'selected' : ''}`}
                          onClick={() => handleCountrySelect(country)}
                        >
                          {country}
                        </div>
                      ))}
                    </div>
                  )}
                  {showDropdown && countrySearch && filteredCountries.length === 0 && (
                    <div className="country-dropdown">
                      <div className="country-option no-results">
                        No countries found. You can still proceed with "{countrySearch}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="submit-resort-btn"
                  onClick={handleExploreResorts}
                  disabled={!countrySearch.trim()}
                >
                  Explore Resorts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resorts Display */}
      {!showCountryPopup && (
        <div className="resorts-section">
          <div className="section-header">
            <h2>Resorts in {selectedCountry}</h2>
            <div className="section-header-right">
              <div className="resorts-search-bar-wrapper">
                <form className="resorts-search-bar" onSubmit={e => e.preventDefault()}>
                  <input
                    type="text"
                    placeholder="Search in resorts, city or company..."
                    value={resortSearch}
                    onChange={e => setResortSearch(e.target.value)}
                  />
                </form>
              </div>
              <button
                className="change-country-btn"
                onClick={() => {
                  setShowCountryPopup(true)
                  setResorts([])
                }}
              >
                Change Country
              </button>
            </div>
          </div>

          {loadingResorts ? (
            <p className="loading-resorts">Loading resorts...</p>
          ) : filteredResorts.length === 0 ? (
            <p className="no-resorts">
              No resorts found in {selectedCountry} with that search. Please try another search or country.
            </p>
          ) : (
            <div className="resorts-grid">
              {filteredResorts.map((resort) => {
                const isDisabled = resort.status === 'full' || resort.status === 'closed'
                return (
                  <div 
                    key={resort.resort_id} 
                    className={`resort-card ${isDisabled ? 'disabled-resort' : ''}`}
                  >
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
                      <h3>{resort.name}</h3><br></br>
                      <span className={`status-badge status-${resort.status.replace(' ', '-')}`}>
                        {resort.status}
                      </span>
                    </div>
                    <div className="resort-card-body">
                      <div className="resort-info">
                        <p className="resort-company">
                          {"Company: "} 
                          {resort.company_name || 'Unknown Company'}
                        </p>
                        <p className="resort-location">
                          {"Location: "} 
                          {resort.city}, {resort.country}
                        </p>
                        <p className="resort-type">
                          <span className="icon">{"Type: "}</span>
                          {resort.type.charAt(0).toUpperCase() + resort.type.slice(1)}
                        </p>
                      </div>
                      <div className="resort-price">
                        <span className="price-label">
                          {resort.type === 'hotel' ? 'Price per night:' : 'Ticket price:'}
                        </span>
                        <span className="price-value">${resort.price.toFixed(2)}</span>
                      </div>
                      {/* Social Links */}
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
                          className="view-details-btn"
                          onClick={() => handleViewDetails(resort)}
                        >
                          View Blogs
                        </button>
                        <button
                          className={`book-resort-btn ${isDisabled ? 'disabled' : ''}`}
                          onClick={() => !isDisabled && handleBookResort(resort)}
                          disabled={isDisabled}
                        >
                          {isDisabled ? 'Not Available' : 'Book Resort'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Booking Popup */}
      {showBookingPopup && selectedResort && (
        <div className="modal-overlay" onClick={handleCloseBookingPopup}>
          <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book {selectedResort.name}</h2>
              <button className="close-btn" onClick={handleCloseBookingPopup}>×</button>
            </div>
            <div className="modal-body">
              {bookingError && (
                <div className="error-message">{bookingError}</div>
              )}
              {bookingSuccess && (
                <div className="success-message">{bookingSuccess}</div>
              )}
              
              <div className="booking-form">
                <div className="form-group">
                  <label htmlFor="booking-date">Booking Date *</label>
                  <input
                    id="booking-date"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">
                    {selectedResort.type === 'hotel' ? 'Number of Nights *' : 'Number of Tickets *'}
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div className="booking-summary">
                  <div className="summary-row">
                    <span>Price per {selectedResort.type === 'hotel' ? 'night' : 'ticket'}:</span>
                    <span>${selectedResort.price.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Quantity:</span>
                    <span>{quantity}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total Price:</span>
                    <span>${calculateTotalPrice().toFixed(2)}</span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCloseBookingPopup}
                    disabled={isBooking}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="submit-booking-btn"
                    onClick={handleSubmitBooking}
                    disabled={isBooking || !bookingDate}
                  >
                    {isBooking ? 'Booking...' : 'Book Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resort Blogs Popup */}
      {showDetailsPopup && detailsResort && (
        <div className="modal-overlay" onClick={handleCloseDetailsPopup}>
          <div className="modal-content resort-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Blogs - {detailsResort.name}</h2>
              <button className="close-btn" onClick={handleCloseDetailsPopup}>×</button>
            </div>
            <div className="modal-body">
              {/* Blogs Section */}
              <div className="resort-blogs-section">
                {loadingBlogs ? (
                  <p>Loading blogs...</p>
                ) : resortBlogs.length === 0 ? (
                  <p style={{color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '2rem'}}>
                    No blogs posted yet for this resort.
                  </p>
                ) : (
                  <div className="blogs-list">
                    {resortBlogs.map((blog) => (
                      <div key={blog.blog_id} className="blog-card-horizontal">
                        {blog.image_name && (
                          <div className="blog-card-image-left">
                            <img 
                              src={`${API_BASE_URL}/blog-images/${blog.image_name}`} 
                              alt={blog.caption.substring(0, 50)}
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <div className="blog-card-content-right">
                          <div className="blog-card-header">
                            <h4>{blog.resort_name}</h4>
                          </div>
                          <div className="blog-card-body">
                            <p className="blog-caption" style={{whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '1rem'}}>
                              {blog.caption}
                            </p>
                            <p className="blog-date" style={{fontSize: '0.9rem', color: '#666'}}>
                              {new Date(blog.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseDetailsPopup}
                >
                  Close
                </button>
                {detailsResort.status !== 'full' && detailsResort.status !== 'closed' && (
                  <button
                    type="button"
                    className="submit-booking-btn"
                    onClick={() => {
                      handleCloseDetailsPopup()
                      handleBookResort(detailsResort)
                    }}
                  >
                    Book Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardHome

