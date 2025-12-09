import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>About Us</h3>
          <p>Roamly, a complete platform to book adventurous resorts as well as comfy hotels all around the world!</p>
        </div>
        
        <div className="footer-section">
          <h3>Developed By</h3>
          <p>Aina Aroob</p>
          <p>Hafsa Feroze</p>
        </div>
        
        <div className="footer-section">
          <h3>Contact Us</h3>
          <p>03234338411</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} Roamly. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer


