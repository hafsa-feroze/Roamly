import { useState, useEffect } from 'react'
import axios from 'axios'
import '../shared/DashboardMyResorts.css'

const API_BASE_URL = 'http://localhost:8000'

function DashboardMyBlogs() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    const companyId = localStorage.getItem('user_id')
    if (!companyId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${API_BASE_URL}/blogs?company_id=${companyId}`)
      if (response.data && response.data.blogs) {
        setBlogs(response.data.blogs)
      }
    } catch (err) {
      console.error('Error fetching blogs:', err)
      setError('Failed to load blogs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (blogId) => {
    const companyId = localStorage.getItem('user_id')
    if (!companyId) return
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/blogs/${blogId}?company_id=${companyId}`)
      // Remove from local state
      setBlogs(blogs.filter(b => b.blog_id !== blogId))
    } catch (err) {
      alert('Failed to delete blog. Please try again.')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="dashboard-resorts">
   
      {loading ? (
        <p className="loading-resorts">Loading blogs...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : blogs.length === 0 ? (
        <p className="no-resorts">No blogs found. Add your first blog from the My Resorts page.</p>
      ) : (
        <div className="resorts-list-section">
          <div className="blogs-list">
            {blogs.map((blog) => (
              <div key={blog.blog_id} className="blog-card-horizontal" style={{position:'relative'}}>
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
                <button
                  onClick={() => handleDelete(blog.blog_id)}
                  style={{
                    position: 'absolute',
                    top: 18,
                    right: 18,
                    background: '#c62828',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.4rem 1.2rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                >
                  Delete
                </button>
                <div className="blog-card-content-right">
                  <div className="blog-card-header">
                    <h3>{blog.resort_name}</h3>
                  </div>
                  <div className="blog-card-body">
                    <p className="blog-caption" style={{whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '1rem'}}>
                      {blog.caption}
                    </p>
                    <p className="blog-date" style={{fontSize: '0.9rem', color: '#666'}}>
                      {formatDate(blog.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardMyBlogs

