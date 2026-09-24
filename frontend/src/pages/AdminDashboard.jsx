import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, UploadCloud, Trash2, FileText, Settings, ShieldCheck, Mail, Lock, Calendar, PlusCircle, Folder, FolderPlus, Grid } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Resource State
  const [resources, setResources] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [folderId, setFolderId] = useState('');
  const [actionType, setActionType] = useState('flipbook');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Structure State
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAllowDownload, setNewCatAllowDownload] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedCatForFolder, setSelectedCatForFolder] = useState('');

  // User State
  const [users, setUsers] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userExpiry, setUserExpiry] = useState('1'); // Months
  const [customDate, setCustomDate] = useState('');
  const [userAdding, setUserAdding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchResources();
    fetchUsers();
    fetchStructure();
  }, [navigate]);

  const fetchStructure = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const catRes = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, { headers: { 'Authorization': `Bearer ${token}` } });
      const folRes = await fetch(`${import.meta.env.VITE_API_URL}/api/folders`, { headers: { 'Authorization': `Bearer ${token}` } });
      
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats);
        if (cats.length > 0 && !category) setCategory(cats[0].slug);
        if (cats.length > 0 && !selectedCatForFolder) setSelectedCatForFolder(cats[0].slug);
      }
      if (folRes.ok) {
        setFolders(await folRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      const data = await res.json();
      if (res.ok) setResources(data);
    } catch (err) {
      console.error("Failed to fetch resources", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // --- Resource Handlers ---
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this resource?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${import.meta.env.VITE_API_URL}/api/resources/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchResources();
    } catch (err) {
      console.error("Failed to delete resource", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    if (folderId) formData.append('folderId', folderId);
    formData.append('actionType', actionType);
    if (file) formData.append('file', file);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setTitle('');
        setFile(null);
        setFolderId('');
        e.target.reset();
        fetchResources();
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
    }
  };

  // --- Structure Handlers ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newCatName, allowDownload: newCatAllowDownload })
      });
      setNewCatName('');
      setNewCatAllowDownload(false);
      fetchStructure();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (slug) => {
    if (!window.confirm('Delete category? This deletes all folders and resources inside it!')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/categories/${slug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchStructure();
      fetchResources();
    } catch (err) { console.error(err); }
  };

  const handleAddFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim() || !selectedCatForFolder) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newFolderName, categorySlug: selectedCatForFolder })
      });
      setNewFolderName('');
      fetchStructure();
    } catch (err) { console.error(err); }
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Delete this folder? Its resources will be moved to the parent category.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/folders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchStructure();
      fetchResources();
    } catch (err) { console.error(err); }
  };

  // --- User Handlers ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserAdding(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
          expiryMonths: userExpiry,
          customExpiryDate: userExpiry === 'custom' ? customDate : null
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUserEmail('');
        setUserPassword('');
        setCustomDate('');
        fetchUsers();
      } else {
        alert(data.error || 'Failed to add user');
      }
    } catch (err) {
      console.error("User add error", err);
    } finally {
      setUserAdding(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this user\'s access? This action is immediate.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) return (
    <div className="admin-loading-screen">
      <div className="spinner"></div>
      <p>Initializing Secure Dashboard...</p>
    </div>
  );

  return (
    <div className="admin-dash-wrapper">
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="brand-logo-circle">
            <ShieldCheck size={24} color="#3b82f6" />
          </div>
          <h2>Hoot Admin</h2>
          <span className="brand-badge">Vault Access</span>
          <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        
        <nav className="admin-nav-links">
          <button 
            className={`admin-nav-btn ${activeTab === 'resources' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('resources'); setMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={20} />
            <span>Manage Resources</span>
          </button>

          <button 
            className={`admin-nav-btn ${activeTab === 'structure' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('structure'); setMobileMenuOpen(false); }}
          >
            <FolderPlus size={20} />
            <span>Manage Folders</span>
          </button>
          
          <button 
            className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
          >
            <Users size={20} />
            <span>Manage Users</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={18} />
            Logout Securely
          </button>
        </div>
      </aside>

      <main className="admin-main-area">
        <header className="admin-top-header">
          <div className="header-mobile-toggle">
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>
          <div className="header-titles">
            <h1>{activeTab === 'resources' ? 'Resource Vault' : activeTab === 'structure' ? 'Category & Folder Structure' : 'User Access Control'}</h1>
            <p>{activeTab === 'resources' ? 'Upload and manage secure educational materials.' : activeTab === 'structure' ? 'Organize folders that appear in the student dashboard.' : 'Generate accounts and manage subscription expirations.'}</p>
          </div>
        </header>

        <div className="admin-content-scroll">
          {activeTab === 'resources' && (
            <div className="admin-grid-layout">
              {/* Upload Form */}
              <section className="admin-glass-card upload-section">
                <div className="card-header">
                  <UploadCloud size={24} className="card-icon blue-icon" />
                  <h3>Upload New Material</h3>
                </div>
                
                <form onSubmit={handleUpload} className="modern-form">
                  <div className="input-group">
                    <label>Resource Title</label>
                    <div className="input-wrapper">
                      <FileText size={18} className="input-icon" />
                      <input type="text" placeholder="e.g. Grade 5 Math Guide" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="input-group">
                      <label>Category (Sidebar Tab)</label>
                      <select value={category} onChange={e => { setCategory(e.target.value); setFolderId(''); }}>
                        {categories.map(c => (
                          <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Sub-Folder (Optional)</label>
                      <select value={folderId} onChange={e => setFolderId(e.target.value)}>
                        <option value="">-- No Folder (Loose in Category) --</option>
                        {folders.filter(f => f.categorySlug === category).map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row-2" style={{ marginTop: '20px' }}>
                    <div className="input-group">
                      <label>File Type & Permissions</label>
                      <select value={actionType} onChange={e => setActionType(e.target.value)}>
                        <option value="flipbook">PDF (Protected Flipbook)</option>
                        {categories.find(c => c.slug === category)?.allowDownload && (
                          <option value="download">PDF (Downloadable)</option>
                        )}
                        <option value="video">Video Player (Non-Downloadable)</option>
                        <option value="View">Word Document (.docx / .doc)</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group file-drop-zone">
                    <label>Upload File (PDF, MP4, or Word Doc)</label>
                    <input type="file" accept=".pdf,.mp4,.mov,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
                  </div>

                  <button type="submit" className="primary-action-btn" disabled={uploading}>
                    {uploading ? <div className="btn-spinner"></div> : <><UploadCloud size={18}/> Secure Upload</>}
                  </button>
                </form>
              </section>

              {/* Resource List */}
              <section className="admin-glass-card list-section">
                <div className="card-header">
                  <FileText size={24} className="card-icon green-icon" />
                  <h3>Vault Contents</h3>
                </div>
                
                <div className="custom-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.length === 0 ? (
                        <tr><td colSpan="4" className="empty-row">Vault is empty</td></tr>
                      ) : (
                        resources.map(r => (
                          <tr key={r.id}>
                            <td className="fw-600 text-dark">{r.title}</td>
                            <td>
                              <span className="pill-badge blue-pill">{categories.find(c => c.slug === r.category)?.name || r.category}</span>
                              {r.folder && <span className="pill-badge gray-pill" style={{marginLeft: '8px'}}>{r.folder.name}</span>}
                            </td>
                            <td><span className="pill-badge gray-pill">{r.actionType}</span></td>
                            <td className="text-right">
                              <button onClick={() => handleDeleteResource(r.id)} className="icon-delete-btn" title="Delete Resource">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
          {activeTab === 'structure' && (
            <div className="admin-grid-layout" style={{ gridTemplateColumns: '1fr' }}>
              
              <section className="admin-glass-card list-section">
                <div className="card-header" style={{ justifyContent: 'space-between', display: 'flex' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FolderPlus size={24} className="card-icon blue-icon" />
                    <h3>Sidebar Categories</h3>
                  </div>
                  <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                      <input type="checkbox" checked={newCatAllowDownload} onChange={e => setNewCatAllowDownload(e.target.checked)} />
                      Allow Downloads?
                    </label>
                    <input type="text" placeholder="New Category Name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    <button type="submit" className="primary-action-btn" style={{ padding: '8px 16px', minWidth: 'auto' }}>Add Category</button>
                  </form>
                </div>
                
                <div className="custom-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Slug ID</th>
                        <th>Permissions</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.length === 0 ? <tr><td colSpan="4" className="empty-row">No categories</td></tr> : categories.map(c => (
                        <tr key={c.slug}>
                          <td className="fw-600 text-dark">{c.name}</td>
                          <td><span className="pill-badge gray-pill">{c.slug}</span></td>
                          <td>
                            {c.allowDownload ? <span className="pill-badge green-pill">Downloads Allowed</span> : <span className="pill-badge red-pill">Protected (No Downloads)</span>}
                          </td>
                          <td className="text-right">
                            <button onClick={() => handleDeleteCategory(c.slug)} className="icon-delete-btn"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-glass-card list-section">
                <div className="card-header" style={{ justifyContent: 'space-between', display: 'flex' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Grid size={24} className="card-icon emerald-icon" />
                    <h3>Sub-Folders</h3>
                  </div>
                  <form onSubmit={handleAddFolder} style={{ display: 'flex', gap: '10px' }}>
                    <select value={selectedCatForFolder} onChange={e => setSelectedCatForFolder(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                    </select>
                    <input type="text" placeholder="New Folder Name..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    <button type="submit" className="primary-action-btn emerald-btn" style={{ padding: '8px 16px', minWidth: 'auto' }}>Create Folder</button>
                  </form>
                </div>
                
                <div className="custom-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Folder Name</th>
                        <th>Parent Category</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {folders.length === 0 ? <tr><td colSpan="3" className="empty-row">No folders</td></tr> : folders.map(f => (
                        <tr key={f.id}>
                          <td className="fw-600 text-dark">{f.name}</td>
                          <td><span className="pill-badge blue-pill">{categories.find(c => c.slug === f.categorySlug)?.name || f.categorySlug}</span></td>
                          <td className="text-right">
                            <button onClick={() => handleDeleteFolder(f.id)} className="icon-delete-btn"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-grid-layout">
              {/* Add User Form */}
              <section className="admin-glass-card upload-section">
                <div className="card-header">
                  <PlusCircle size={24} className="card-icon emerald-icon" />
                  <h3>Generate Account</h3>
                </div>
                
                <form onSubmit={handleAddUser} className="modern-form">
                  <div className="input-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <Mail size={18} className="input-icon" />
                      <input type="email" placeholder="student@school.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <label>Assign Password</label>
                    <div className="input-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input type="text" placeholder="Secure Password" value={userPassword} onChange={e => setUserPassword(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="input-group">
                      <label>Access Duration</label>
                      <select value={userExpiry} onChange={e => setUserExpiry(e.target.value)}>
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                        <option value="custom">Custom Date</option>
                      </select>
                    </div>
                    {userExpiry === 'custom' && (
                      <div className="input-group animate-in">
                        <label>Exact Expiry Date</label>
                        <div className="input-wrapper">
                          <Calendar size={18} className="input-icon" />
                          <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} required />
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="primary-action-btn emerald-btn" disabled={userAdding}>
                    {userAdding ? <div className="btn-spinner"></div> : <><ShieldCheck size={18}/> Grant Access</>}
                  </button>
                </form>
              </section>

              {/* User List */}
              <section className="admin-glass-card list-section">
                <div className="card-header">
                  <Users size={24} className="card-icon purple-icon" />
                  <h3>Active Subscriptions</h3>
                </div>
                
                <div className="custom-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Account Details</th>
                        <th>Created</th>
                        <th>Status / Expiry</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan="4" className="empty-row">No users generated yet.</td></tr>
                      ) : (
                        users.map(u => {
                          const isExpired = new Date(u.expiresAt) < new Date();
                          return (
                            <tr key={u.id} className={isExpired ? 'expired-row' : ''}>
                              <td className="fw-600 text-dark">
                                <div className="user-email-cell">
                                  <div className={`status-dot ${isExpired ? 'red' : 'green'}`}></div>
                                  {u.email}
                                </div>
                              </td>
                              <td className="text-light">{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td>
                                {isExpired ? (
                                  <span className="pill-badge red-pill">Expired {new Date(u.expiresAt).toLocaleDateString()}</span>
                                ) : (
                                  <span className="pill-badge emerald-pill">Active until {new Date(u.expiresAt).toLocaleDateString()}</span>
                                )}
                              </td>
                              <td className="text-right">
                                <button onClick={() => handleDeleteUser(u.id)} className="icon-delete-btn outline-red" title="Revoke Access Immediately">
                                  <LogOut size={16} /> Revoke
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
