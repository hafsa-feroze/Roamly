import { useEffect, useState } from 'react';
import axios from 'axios';
import '../DashboardPage.css'; // for dashboard style; add RegisteredCompanies-specific CSS if needed

const API_BASE_URL = 'http://localhost:8000';

function RegisteredCompanies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupResorts, setPopupResorts] = useState([]);
  const [popupCompany, setPopupCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingResorts, setLoadingResorts] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        // Replace with your backend API endpoint
        const res = await axios.get('http://localhost:8000/companies-with-revenue');
        setCompanies(res.data?.companies || []);
      } catch (err) {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const openResortsPopup = async (company) => {
    setPopupCompany(company);
    setShowPopup(true);
    setLoadingResorts(true);
    try {
      const res = await axios.get(`http://localhost:8000/resorts-with-image?company_id=${company.company_id}`);
      setPopupResorts(res.data?.resorts || []);
    } catch {
      setPopupResorts([]);
    } finally {
      setLoadingResorts(false);
    }
  };
  const closePopup = () => {
    setShowPopup(false);
    setPopupResorts([]);
    setPopupCompany(null);
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-main-companies-list" style={{padding: '2rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap: 'wrap',gap:'1.5rem',marginBottom:'2.5rem'}}>
        <h2 style={{color:'#fff',margin:0}}>Registered Companies</h2>
        <form style={{display:'flex',alignItems:'center',background:'#fff',borderRadius:'30px',padding:'0.35rem 1.25rem', border:'1.5px solid #dedede',width:'270px'}} onSubmit={e=>e.preventDefault()}>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search companies..." style={{border:'none',outline:'none',fontSize:'1.07rem',background:'transparent',flex:1}}/>
          
        </form>
      </div>
      {loading ? (<div style={{color:'#fff',textAlign:'center'}}>Loading companies...</div>) : (
        <div style={{display:'grid',gap:'2rem',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',maxWidth:1200,margin:'0 auto'}}>
          {filteredCompanies.map(company => (
            <div key={company.company_id} className="company-card" style={{background:'#fff',borderRadius:'16px',boxShadow:'0 8px 32px rgba(0,0,0,0.12)',padding:'2rem',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'1.25rem',minHeight:'200px'}}>
              <div style={{fontSize:'1.45rem',fontWeight:700,color:'#8b4119',marginBottom:'0.5rem'}}>{company.name}</div>
              <div style={{color:'#323232',fontWeight:500,fontSize:'1.09rem',marginBottom:'0.25rem'}}>Total Revenue: <span style={{color:'#479b28',fontWeight:700}}>${company.revenue!=null ? company.revenue.toLocaleString() : '0'}</span></div>
              <div style={{color:'#323232',fontWeight:500,fontSize:'1.09rem',marginBottom:'0.25rem'}}>Number of Resorts: <span style={{color:'#8b4119',fontWeight:700}}>{company.resort_count || 0}</span></div>
              <div style={{color:'#323232',fontWeight:500,fontSize:'1.09rem',marginBottom:'0.25rem'}}>Number of Bookings: <span style={{color:'#8b4119',fontWeight:700}}>{company.booking_count || 0}</span></div>
              <button onClick={()=>openResortsPopup(company)} className="view-details-btn" style={{marginTop:'auto',padding:'0.85rem 1.2rem',background:'#8b4119',color:'#fff',fontWeight:600,border:'none',borderRadius:'8px',fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 12px rgba(139,65,25,0.06)'}}>View Resorts</button>
            </div>
          ))}
          {filteredCompanies.length === 0 && (<div style={{color:'#fff',textAlign:'center',gridColumn:'1/-1'}}>No companies found.</div>)}
        </div>
      )}
      {/* Resorts Popup */}
      {showPopup && (
        <div className="modal-overlay" onClick={closePopup} style={{zIndex:1002}}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:800,padding:'2.5rem',borderRadius:'16px'}}>
            <div className="modal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'2px solid #e0e0e0',marginBottom:'2rem'}}>
              <h3 style={{margin:0,fontSize:'2rem',fontWeight:700,color:'#000'}}>Resorts by {popupCompany?.name}</h3>
              <button onClick={closePopup} className="close-btn" style={{fontSize:'2rem',color:'#666',background:'none',border:'none',cursor:'pointer',marginLeft:'1.5rem'}}>&times;</button>
            </div>
            {loadingResorts ? (<div style={{textAlign:'center',padding:'2rem 0'}}>Loading resorts...</div>) : (
              popupResorts.length > 0 ? (
                <div style={{maxHeight:'60vh',overflowY:'auto',display:'flex',flexDirection:'column',gap:'1rem'}}>
                  {popupResorts.map(resort => (
                    <div key={resort.resort_id} style={{
                      display:'flex',
                      alignItems:'center',
                      gap:'1rem',
                      padding:'1rem',
                      border:'1px solid #e0e0e0',
                      borderRadius:'12px',
                      background:'#fff',
                      transition:'all 0.2s ease'
                    }}>
                      {resort.image_name && (
                        <div style={{
                          width:'120px',
                          height:'120px',
                          minWidth:'120px',
                          borderRadius:'8px',
                          overflow:'hidden',
                          background:'#f0f0f0',
                          flexShrink:0
                        }}>
                          <img 
                            src={`${API_BASE_URL}/images/${resort.image_name}`}
                            alt={resort.name}
                            style={{
                              width:'100%',
                              height:'100%',
                              objectFit:'cover',
                              display:'block'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'1.6rem',fontWeight:700,color:'#000',marginBottom:'0.25rem'}}>
                          {resort.name}
                        </div>
                        <div style={{fontSize:'0.95rem', fontWeight:500,color:'#666'}}>
                          {resort.city}, {resort.country}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'2rem 0'}}>No resorts found for this company.</div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default RegisteredCompanies;
