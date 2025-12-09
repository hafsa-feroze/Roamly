import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import './LoginPage.css'

const API_BASE_URL = 'http://localhost:8000'

function LoginPage() {
  const navigate = useNavigate()
  const [selectedUserType, setSelectedUserType] = useState('Customer')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const showPopup = (message, type = 'error') => {
    if (type === 'error') {
      setError(message)
      setSuccess('')
    } else {
      setSuccess(message)
      setError('')
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (type === 'error') {
        setError('')
      } else {
        setSuccess('')
      }
    }, 5000)
  }

  const handleUserTypeChange = (userType) => {
    setSelectedUserType(userType)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Basic validation
    if (!formData.email || !formData.password) {
      showPopup('Please fill in all fields', 'error')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: formData.email,
        password: formData.password,
        user_type: selectedUserType
      })

      if (response.data) {
        // Store user information
        localStorage.setItem('user_id', response.data.user_id)
        localStorage.setItem('user_name', response.data.name)
        localStorage.setItem('user_email', response.data.email)
        localStorage.setItem('user_type', response.data.user_type)

        // Show success message based on user type
        const userType = response.data.user_type
        let welcomeMessage = response.data.message || 'Login successful!'
        
        if (userType === 'Company') {
          welcomeMessage = `Welcome back, ${response.data.name}! You are logged in as a Company.`
        } else if (userType === 'Customer') {
          welcomeMessage = `Welcome back, ${response.data.name}! You are logged in as a Customer.`
        } else if (userType === 'Admin') {
          welcomeMessage = `Welcome back, ${response.data.name}! You are logged in as an Admin.`
        }

        showPopup(welcomeMessage, 'success')
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Login failed. Please check your credentials and try again.'
      showPopup(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Login</h1>
        
        {/* User Type Tabs */}
        <div className="user-type-tabs">
          <button
            type="button"
            className={`tab-btn ${selectedUserType === 'Customer' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('Customer')}
          >
            Customer
          </button>
          <button
            type="button"
            className={`tab-btn ${selectedUserType === 'Company' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('Company')}
          >
            Company
          </button>
          <button
            type="button"
            className={`tab-btn ${selectedUserType === 'Admin' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('Admin')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message popup-message">{error}</div>}
          {success && <div className="success-message popup-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  )
}

export default LoginPage

