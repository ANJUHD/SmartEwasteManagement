import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API =
  process.env.REACT_APP_API ||
  'https://smart-ewaste-management.onrender.com/api';

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
      // LOGIN: /api/auth/login
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
        { status: newStatus },
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
        // rest of your dashboard JSX stays exactly the same
        // ...
        <div className="dashboard">{/* existing dashboard code */}</div>
      )}
    </div>
  );
}

export default App;
