import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = process.env.REACT_APP_API || 'http://localhost:4000/api';

function App() {
  const [token, setToken] = useState('');
  const [pickups, setPickups] = useState([]);
  const [centers, setCenters] = useState([]);
  const [nearestCenters, setNearestCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [centersLoading, setCentersLoading] = useState(false);
  const [pickupsLoading, setPickupsLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [message, setMessage] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showNearest, setShowNearest] = useState(false);
  const [login, setLogin] = useState({
    email: 'admin@admin.com',
    password: 'admin123',
  });

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(() => fetchData(true), 20000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      await Promise.all([fetchPickups(silent), fetchCenters(silent)]);
    } catch (e) {
      setMessage('Error loading data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const doLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API}/auth/login`, login);
      setToken(res.data.token);
      setMessage(`✓ Logged in as ${res.data.user.email}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setMessage('✗ Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const doLogout = () => {
    setToken('');
    setPickups([]);
    setCenters([]);
    setNearestCenters([]);
    setUserLocation(null);
    setShowNearest(false);
    setMessage('Logged out');
    setTimeout(() => setMessage(''), 2000);
  };

  const fetchPickups = async (silent = false) => {
    try {
      if (!silent) setPickupsLoading(true);
      const res = await axios.get(`${API}/pickups`, {
        headers: { authorization: 'Bearer ' + token },
      });
      setPickups(res.data);
    } catch (err) {
      console.error('fetchPickups', err?.response?.data || err.message);
    } finally {
      if (!silent) setPickupsLoading(false);
    }
  };

  const fetchCenters = async (silent = false, city = '') => {
    try {
      if (!silent) setCentersLoading(true);
      const res = await axios.get(`${API}/centers`, {
        headers: { authorization: 'Bearer ' + token },
        params: city ? { city } : {},
      });
      setCenters(res.data);
      const citySet = new Set();
      res.data.forEach((c) => {
        if (c.address) {
          const parts = c.address.split(',').map((p) => p.trim());
          const maybeCity = parts.length > 1 ? parts[1] : parts[0];
          if (maybeCity) citySet.add(maybeCity);
        }
      });
      setCities(Array.from(citySet));
    } catch (err) {
      console.error('fetchCenters', err?.response?.data || err.message);
    } finally {
      if (!silent) setCentersLoading(false);
    }
  };

  const getLocationAndFindNearest = async (radiusKm = 50) => {
    try {
      setLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });

            const res = await axios.get(`${API}/centers/nearest/distance`, {
              params: { latitude, longitude, limit: 8 },
              headers: { authorization: 'Bearer ' + token },
            });

            setNearestCenters(res.data);
            setShowNearest(true);
            setMessage('✓ Found nearest centers based on your location');
            setTimeout(() => setMessage(''), 3000);
          },
          () => {
            setMessage(
              '✗ Unable to access location. Please enable location access.'
            );
            setLoading(false);
          }
        );
      } else {
        setMessage('✗ Geolocation not supported by browser');
        setLoading(false);
      }
    } catch (e) {
      setMessage('✗ Error finding nearest centers');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchCentersByCity = async (city) => {
    await fetchCenters(false, city);
    setShowNearest(false);
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-pending';
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'approved':
      case 'assigned':
      case 'picked':
        return 'status-in-progress';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const handleStatusChange = async (pickupId, newStatus) => {
    try {
      const res = await axios.patch(
        `${API}/pickups/${pickupId}`,
        { status: newStatus }, // matches controller + schema enum
        { headers: { authorization: 'Bearer ' + token } }
      );
      console.log('PATCH response', res.data);
      setPickups((prev) =>
        prev.map((p) => (p._id === pickupId ? { ...p, status: newStatus } : p))
      );
      setMessage('✓ Status updated');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('update status', err?.response?.data || err.message);
      setMessage('✗ Failed to update status');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  return (
    <div className="app-container">
      {!token ? (
        <div className="login-container">
          <h2>Admin Login</h2>
          <p>Smart E-Waste Management System</p>
          {message && (
            <div
              className={`alert ${
                message.includes('✗') ? 'alert-error' : 'alert-success'
              }`}
            >
              {message}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doLogin();
            }}
          >
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="admin@admin.com"
                value={login.email}
                onChange={(e) =>
                  setLogin({ ...login, email: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={login.password}
                onChange={(e) =>
                  setLogin({ ...login, password: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      ) : (
        <div className="dashboard">
          <div className="navbar">
            <h1>📊 Smart E-Waste Admin Dashboard</h1>
            <p>Manage recycling centers and track e-waste pickups</p>
            <button className="logout-btn" onClick={doLogout}>
              Logout
            </button>
          </div>

          {message && (
            <div
              className={`alert ${
                message.includes('✓') ? 'alert-success' : 'alert-error'
              }`}
            >
              {message}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading data...</div>
          ) : (
            <>
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">♻️ Recycling Centers</h2>
                  <div
                    style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                  >
                    <select
                      onChange={(e) => fetchCentersByCity(e.target.value)}
                      defaultValue=""
                    >
                      <option value="">All Cities</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <button
                      className="find-nearest-btn"
                      onClick={() => getLocationAndFindNearest()}
                    >
                      📍 Find Nearest Centers
                    </button>
                  </div>
                </div>

                {showNearest && nearestCenters.length > 0 ? (
                  <>
                    <div className="location-info">
                      📍 Your Location:{' '}
                      {userLocation?.latitude.toFixed(4)},{' '}
                      {userLocation?.longitude.toFixed(4)}
                    </div>
                    <div className="centers-grid">
                      {nearestCenters.map((c) => (
                        <div key={c._id} className="center-card nearest">
                          <div className="distance-badge">
                            {c.distanceKm} km
                          </div>
                          <h3>{c.name}</h3>
                          <p>
                            <strong>📍 Address:</strong> {c.address}
                          </p>
                          <p>
                            <strong>📞 Phone:</strong> {c.phone || 'N/A'}
                          </p>
                          <p>
                            <strong>📧 Email:</strong> {c.email || 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      className="show-all-btn"
                      onClick={() => setShowNearest(false)}
                    >
                      Show All Centers
                    </button>
                  </>
                ) : (
                  <>
                    {centers.length === 0 ? (
                      <div className="empty-state">No centers found</div>
                    ) : (
                      <div className="centers-grid">
                        {centers.map((c) => (
                          <div key={c._id} className="center-card">
                            <h3>{c.name}</h3>
                            <p>
                              <strong>📍 Address:</strong> {c.address}
                            </p>
                            <p>
                              <strong>📞 Phone:</strong> {c.phone || 'N/A'}
                            </p>
                            <p>
                              <strong>📧 Email:</strong> {c.email || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="section">
                <h2 className="section-title">📦 Pickup Requests</h2>
                {pickups.length === 0 ? (
                  <div className="empty-state">No pickup requests yet</div>
                ) : (
                  <div className="pickups-table-container">
                    <table className="pickups-table">
                      <thead>
                        <tr>
                          <th>User Name</th>
                          <th>Items</th>
                          <th>Weight (g)</th>
                          <th>Center</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pickups.map((p) => (
                          <tr key={p._id}>
                            <td>
                              <strong>{p.user?.name || 'Unknown'}</strong>
                            </td>
                            <td>{p.items.join(', ')}</td>
                            <td>{p.weightGrams || 0}</td>
                            <td>
                              {p.center?.name || p.center?.address || '—'}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${getStatusClass(
                                  p.status
                                )}`}
                              >
                                {(p.status || 'pending').toLowerCase()}
                              </span>
                              <br />
                              <select
                                value={(p.status || 'pending').toLowerCase()}
                                onChange={(e) => {
                                  const newStatus =
                                    e.target.value.toLowerCase();
                                  setPickups((prev) =>
                                    prev.map((row) =>
                                      row._id === p._id
                                        ? { ...row, status: newStatus }
                                        : row
                                    )
                                  );
                                  handleStatusChange(p._id, newStatus);
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="assigned">Assigned</option>
                                <option value="picked">Picked</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                            <td>
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
