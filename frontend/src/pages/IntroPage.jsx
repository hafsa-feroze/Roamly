import { useNavigate } from 'react-router-dom'
import './IntroPage.css'

function IntroPage() {
  const navigate = useNavigate()

  return (
    <div className="intro-container">
      <div className="intro-content">
        <h1 className="intro-title">Welcome to Roamly!</h1>
        <div className="intro-buttons">
          <button 
            className="intro-btn intro-btn-primary"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="intro-btn intro-btn-secondary"
            onClick={() => navigate('/signup')}
          >
            Signup
          </button>
        </div>
      </div>
    </div>
  )
}

export default IntroPage


