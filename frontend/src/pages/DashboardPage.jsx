import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import DashboardHome from './user/DashboardHome'
import DashboardProfile from './shared/DashboardProfile'
import DashboardBookings from './shared/DashboardBookings'
import DashboardCompanyBookings from './company/DashboardCompanyBookings'
import DashboardMyResorts from './company/DashboardMyResorts'
import DashboardNotifications from './company/DashboardNotifications'
import DashboardMyBlogs from './company/DashboardMyBlogs'
import RegisteredCompanies from './admin/RegisteredCompanies';
import Footer from '../components/Footer';
import './DashboardPage.css'

function DashboardPage() {
  const navigate = useNavigate()
  const userType = localStorage.getItem('user_type')
  const userName = localStorage.getItem('user_name') || 'User'
  const isCompany = userType === 'Company'
  const isAdmin = userType === 'Admin';
  
  // Set default tab based on user type
  const getDefaultTab = () => {
    if (isCompany) {
      return 'my-resorts'
    }
    if (isAdmin) {
      return 'companies';
    }
    return 'home';
  }
  
  const [activeTab, setActiveTab] = useState(getDefaultTab())
  const [notificationCount, setNotificationCount] = useState(0)

  // Fetch notification count for companies
  useEffect(() => {
    if (isCompany) {
      const fetchNotificationCount = async () => {
        const companyId = localStorage.getItem('user_id')
        if (!companyId) return

        try {
          const response = await axios.get(`http://localhost:8000/notifications?company_id=${companyId}`)
          if (response.data && response.data.count !== undefined) {
            setNotificationCount(response.data.count)
          }
        } catch (err) {
          console.error('Error fetching notification count:', err)
        }
      }

      fetchNotificationCount()
      // Refresh count every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000)
      
      // Listen for notification count updates from child components
      const handleNotificationUpdate = (event) => {
        setNotificationCount(event.detail)
      }
      window.addEventListener('notificationCountUpdated', handleNotificationUpdate)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('notificationCountUpdated', handleNotificationUpdate)
      }
    }
  }, [isCompany, activeTab])

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return 'U'
    const words = name.trim().split(' ')
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  const handleLogout = () => {
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_type')
    navigate('/')
  }

  const renderContent = () => {
    if (isCompany) {
      // Company navigation
      switch (activeTab) {
        case 'profile':
          return <DashboardProfile />
        case 'my-resorts':
          return <DashboardMyResorts />
        case 'my-blogs':
          return <DashboardMyBlogs />
        case 'bookings':
          return <DashboardCompanyBookings />
        case 'notifications':
          return <DashboardNotifications />
        default:
          return <DashboardMyResorts />
      }
    } else if (isAdmin) {
      // Admin navigation
      switch (activeTab) {
        case 'companies':
          return <RegisteredCompanies />
        case 'profile':
          return <DashboardProfile />
        default:
          return <RegisteredCompanies />
      }
    } else {
      // Customer/Admin navigation
      switch (activeTab) {
        case 'home':
          return <DashboardHome />
        case 'profile':
          return <DashboardProfile />
        case 'bookings':
          return <DashboardBookings />
        default:
          return <DashboardHome />
      }
    }
  }

  const renderNavTabs = () => {
    if (isCompany) {
      return (
        <>
          <button
            className={`nav-tab ${activeTab === 'my-resorts' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-resorts')}
          >
            My Resorts
          </button>
          <button
            className={`nav-tab ${activeTab === 'my-blogs' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-blogs')}
          >
            My Blogs
          </button>
          <button
            className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>
          <button
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`nav-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
        </>
      )
    } else if (isAdmin) {
      return (
        <>
          <button
            className={`nav-tab ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            Registered Companies
          </button>
          <button
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </>
      )
    } else {
      return (
        <>
          <button
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          <button
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`nav-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
        </>
      )
    }
  }

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>Roamly</h2>
        </div>
        <div className="nav-tabs">
          {renderNavTabs()}
        </div>
        <div className="nav-actions">
          <div className="user-avatar" title={userName}>
            {getInitials(userName)}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="dashboard-main">
        {renderContent()}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default DashboardPage

