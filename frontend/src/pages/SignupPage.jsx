import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import './SignupPage.css'

const API_BASE_URL = 'http://localhost:8000'

function SignupPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phonenumber: '',
    user_type: 'Customer'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.phonenumber) {
      showPopup('Please fill in all fields', 'error')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/signup`, formData)
      if (response.data) {
        // Store user info - important for dashboard to know user type
        localStorage.setItem('user_id', response.data.user_id)
        localStorage.setItem('user_name', formData.name)
        localStorage.setItem('user_email', formData.email)
        localStorage.setItem('user_type', formData.user_type)
        
        const userType = formData.user_type
        let successMessage = `Account created successfully!`
        
        if (userType === 'Company') {
          successMessage = `Welcome ${formData.name}! Your Company account has been created successfully.`
        } else if (userType === 'Customer') {
          successMessage = `Welcome ${formData.name}! Your Customer account has been created successfully.`
        }

        showPopup(successMessage, 'success')
        
        // Navigate to dashboard after a short delay - will open company dashboard if Company type
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Signup failed. Please try again.'
      showPopup(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Sign Up</h1>
        <form onSubmit={handleSubmit} className="signup-form">
          {error && <div className="error-message popup-message">{error}</div>}
          {success && <div className="success-message popup-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your name"
            />
          </div>

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
            <label htmlFor="phonenumber">Phone Number</label>
            <input
              type="tel"
              id="phonenumber"
              name="phonenumber"
              value={formData.phonenumber}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
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

          <div className="form-group">
            <label htmlFor="user_type">Account Type</label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              required
              className="select-input"
            >
              <option value="Customer">Customer</option>
              <option value="Company">Company</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  )
}

export default SignupPage

