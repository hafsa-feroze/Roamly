import './DashboardProfile.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

function DashboardProfile() {
  const [userId] = useState(localStorage.getItem('user_id'))
  const [userType] = useState(localStorage.getItem('user_type'))
  const [profile, setProfile] = useState({
    name: localStorage.getItem('user_name') || '',
    email: localStorage.getItem('user_email') || '',
    phonenumber: localStorage.getItem('user_contact') || localStorage.getItem('user_phonenumber') || '',
  })
  const [editProfile, setEditProfile] = useState(profile)
  
  // Fetch user data on mount to ensure all fields are populated
  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/user/${userId}`)
          const userData = response.data
          const updatedProfile = {
            name: userData.name || '',
            email: userData.email || '',
            phonenumber: userData.phonenumber || ''
          }
          setProfile(updatedProfile)
          setEditProfile(updatedProfile)
          // Update localStorage
          localStorage.setItem('user_name', userData.name)
          localStorage.setItem('user_email', userData.email)
          localStorage.setItem('user_contact', userData.phonenumber)
        } catch (err) {
          console.error('Error fetching user data:', err)
          // Fallback to localStorage if API fails
          const storedName = localStorage.getItem('user_name') || ''
          const storedEmail = localStorage.getItem('user_email') || ''
          const storedContact = localStorage.getItem('user_contact') || localStorage.getItem('user_phonenumber') || ''
          setProfile({
            name: storedName,
            email: storedEmail,
            phonenumber: storedContact
          })
          setEditProfile({
            name: storedName,
            email: storedEmail,
            phonenumber: storedContact
          })
        }
      }
    }
    fetchUserData()
  }, [userId])
  const [profileDirty, setProfileDirty] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const newPasswordInputRef = useRef(null)

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function handleProfileChange(e) {
    const { name, value } = e.target
    setEditProfile((p) => ({ ...p, [name]: value }))
    setProfileDirty(true)
    setProfileSuccess('');
    setProfileError('');
  }

  async function handleProfileSave(e) {
    e.preventDefault()
    setProfileLoading(true)
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await axios.put(`${API_BASE_URL}/user/profile`, {
        user_id: userId,
        ...editProfile
      })
      setProfile(res.data)
      setProfileDirty(false)
      setProfileSuccess('Profile updated!')
      localStorage.setItem('user_name', res.data.name)
      localStorage.setItem('user_email', res.data.email)
      localStorage.setItem('user_contact', res.data.phonenumber)
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleNewPassChange = (e) => {
    setNewPass(e.target.value)
  }

  const handleConfirmPassChange = (e) => {
    setConfirmPass(e.target.value)
  }

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false)
    setNewPass('')
    setConfirmPass('')
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setPasswordSuccess('');
    setPasswordError('');
    if (!newPass || newPass.length < 4) {
      setPasswordError('Password must be at least 4 characters.')
      return
    }
    if (newPass !== confirmPass) {
      setPasswordError("Passwords do not match.")
      return
    }
    setPasswordLoading(true)
    try {
      await axios.put(`${API_BASE_URL}/user/password`, {
        user_id: userId,
        new_password: newPass
      })
      setPasswordSuccess("Password updated!")
      setTimeout(() => {
        handleClosePasswordModal()
      }, 500)
      setTimeout(() => setPasswordSuccess(''), 1200)
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Focus new password input when modal opens
  useEffect(() => {
    if (showPasswordModal && newPasswordInputRef.current) {
      setTimeout(() => {
        newPasswordInputRef.current?.focus()
      }, 100)
    }
  }, [showPasswordModal])

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await axios.delete(`${API_BASE_URL}/user/${userId}`)
      localStorage.clear()
      setTimeout(() => { window.location.href = "/login" }, 400)
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Delete failed.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleNewPassKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.getElementById('confirm-password-input')?.focus()
    }
  }

  const handleConfirmPassKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} }
      handlePasswordSave(fakeEvent)
    }
  }

  function DeleteModal() {
    if (!showDeleteModal) return null
    return (
      <div className="modal-overlay short-modal" onClick={()=>setShowDeleteModal(false)}>
        <div className="modal-content modal-short" onClick={e=>e.stopPropagation()}>
          <h3 style={{fontWeight:800,color:'#c62828',fontSize:'1.11rem',marginBottom:'0.5rem'}}>Delete Account?</h3>
          <p style={{fontSize:'0.96rem',marginBottom:'0.7rem'}}>This cannot be undone. All your data will be deleted. Are you sure?</p>
          {deleteError && <div className="error-message">{deleteError}</div>}
          <div className="form-row" style={{gap: '1.0rem'}}>
            <button className="cancel-btn" style={{padding:'0.64em 1.5em'}} disabled={deleteLoading} onClick={()=>setShowDeleteModal(false)}>Cancel</button>
            <button className="delete-btn" style={{padding:'0.64em 1.5em'}} disabled={deleteLoading} onClick={handleDeleteAccount}>{deleteLoading ? "Deleting..." : "Yes, Delete"}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-profile">
      {showPasswordModal && (
        <div className="modal-overlay short-modal" onClick={handleClosePasswordModal}>
          <div className="modal-content modal-short" onClick={e=>e.stopPropagation()}>
            <h3 className="modal-title">Change Password</h3>
            <form onSubmit={handlePasswordSave} className="password-form" noValidate>
              <div className="form-row">
                <input 
                  ref={newPasswordInputRef}
                  type="password" 
                  id="new-password-input"
                  name="newPassword"
                  className="password-input" 
                  placeholder="New Password" 
                  value={newPass} 
                  minLength={4} 
                  disabled={passwordLoading} 
                  onChange={handleNewPassChange}
                  onKeyDown={handleNewPassKeyDown}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-row">
                <input 
                  type="password" 
                  id="confirm-password-input"
                  name="confirmPassword"
                  className="password-input" 
                  placeholder="Confirm Password" 
                  value={confirmPass} 
                  minLength={4} 
                  disabled={passwordLoading} 
                  onChange={handleConfirmPassChange}
                  onKeyDown={handleConfirmPassKeyDown}
                  autoComplete="new-password"
                />
              </div>
              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
              <div className="form-row modal-actions">
                <button type="submit" className="save-btn modal-btn" disabled={passwordLoading}>{passwordLoading ? "Saving..." : "Save"}</button>
                <button type="button" className="cancel-btn modal-btn" onClick={handleClosePasswordModal} disabled={passwordLoading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <DeleteModal/>
 
      <div className="profile-content">
        <div className="profile-card">
          <h2>Profile Information</h2>
          <form onSubmit={handleProfileSave} autoComplete="off">
            <div className="form-row input-icon-row">
              <label htmlFor="name">Name:</label>
              <input name="name" autoComplete="off" value={editProfile.name} onChange={handleProfileChange} required disabled={profileLoading} />
            </div>
            <div className="form-row input-icon-row">
              <label htmlFor="email">Email:</label>
              <input type="email" name="email" autoComplete="off" value={editProfile.email} onChange={handleProfileChange} required disabled={profileLoading} />
            </div>
            <div className="form-row input-icon-row">
              <label htmlFor="phonenumber">Contact:</label>
              <input name="phonenumber" autoComplete="off" value={editProfile.phonenumber} onChange={handleProfileChange} required disabled={profileLoading} />
            </div>
            {profileError && <div className="error-message">{profileError}</div>}
            {profileSuccess && <div className="success-message">{profileSuccess}</div>}
            <div className="form-row" style={{gap:'1.0rem'}}>
              <button type="submit" className="save-btn" disabled={profileLoading || !profileDirty}>
                {profileLoading ? 'Saving...' : 'Save Info'}
              </button>
              <button type="button" className="secondary-btn" onClick={()=>setShowPasswordModal(true)}>
                Change Password
              </button>
              <button type="button" className="delete-btn outline" onClick={()=>setShowDeleteModal(true)}>
                Delete Account
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Inline modal CSS for overlay and modal */}
      <style>{`
        .input-icon-row { position:relative; }
        .input-icon { position:relative; left:0.29em; font-size: 1.11em; z-index:1; margin-right: -1.51em; opacity:.65; }
        .input-icon + input {
          padding-left: 2.15em !important;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeInModalBg 0.14s;
        }
        @keyframes fadeInModalBg {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-overlay.short-modal { align-items:center; }
        .modal-content {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 32px rgba(0, 0, 0, 0.22);
          padding: 2.5rem 2.2rem;
          min-width: 330px;
          max-width: 90vw;
          position: relative;
          display: flex;
          flex-direction: column;
          animation: slideInModal 0.24s cubic-bezier(0.4, 1.5, 0.4, 1);
        }
        @keyframes slideInModal {
          from {
            transform: translateY(45px) scale(0.92);
            opacity: 0.2;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .modal-content.modal-short { min-width: 320px; max-width: 355px; padding: 1.4rem 1.3rem; }
        .modal-content.modal-short h3 { margin-bottom: 0.52em; }
        .modal-content.modal-short p { margin-bottom: 0.73em; }
        .cancel-btn {
          padding: 0.64em 1.5em;
          border-radius: 8px;
          border: 1.5px solid #ccc;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          background: #eee;
          color: #333;
          transition: background 0.2s;
        }
        .cancel-btn:hover:not(:disabled) {
          background: #f5f5f5;
        }
        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
export default DashboardProfile

