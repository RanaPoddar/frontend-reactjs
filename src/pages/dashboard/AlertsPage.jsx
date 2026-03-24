import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { 
  FaBell, 
  FaTrain, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaFilter,
  FaSort,
  FaClock
} from 'react-icons/fa';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import useAuthStore from '../../stores/useAuthStore';
import useToastStore from '../../stores/useToastStore';

dayjs.extend(relativeTime);

const AlertPage = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { warning } = useToastStore();
  const socketRef = useRef(null);
  
  // State management
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Filter and sort state
  const [filterType, setFilterType] = useState('all'); // all, 7hr, 8hr, 9hr, 10hr, 11hr, 14hr
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, responded
  const [sortBy, setSortBy] = useState('dutyHours'); // dutyHours, time
  
  // Initialize socket connection and listen for real-time alerts
  useEffect(() => {
    if (!token) return;

    try {
      // Connect to socket with authentication
      socketRef.current = io(window.location.origin, {
        auth: {
          token: token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // Handle successful connection
      socketRef.current.on('connected', () => {
        console.log('✅ Connected to alerts socket');
        setIsConnected(true);
        setIsLoading(false);
        setHasError(false);
      });

      // Listen for real-time duty alerts
      socketRef.current.on('dutyAlert', (alertData) => {
        console.log('📨 New duty alert received:', alertData);
        setAlerts((prevAlerts) => {
          // Check if alert already exists
          const exists = prevAlerts.some((a) => a.id === alertData.id);
          if (exists) {
            // Update existing alert
            return prevAlerts.map((a) => (a.id === alertData.id ? alertData : a));
          }
          // Add new alert to the beginning
          return [alertData, ...prevAlerts];
        });
      });

      // Handle alert response updates
      socketRef.current.on('alertResponse', (responseData) => {
        console.log('✓ Alert response received:', responseData);
        setAlerts((prevAlerts) =>
          prevAlerts.map((alert) =>
            alert.id === responseData.alertId
              ? { ...alert, responseAction: responseData.action }
              : alert
          )
        );
      });

      // Handle disconnection
      socketRef.current.on('disconnect', (reason) => {
        console.log('❌ Disconnected from socket:', reason);
        setIsConnected(false);
      });

      // Handle connection errors
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setHasError(true);
        setErrorMessage('Lost connection to alert service. Attempting to reconnect...');
        warning('Alert connection interrupted');
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setHasError(true);
      setErrorMessage('Failed to connect to alert service');
      setIsLoading(false);
    }
  }, [token, warning]);

  // Filter alerts based on selected filters
  const getFilteredAlerts = () => {
    let filtered = [...alerts];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(alert => 
        alert.type === `DUTY_${filterType.toUpperCase()}`
      );
    }

    // Filter by status (responded vs pending)
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending') {
        filtered = filtered.filter(alert => !alert.responseAction);
      } else if (filterStatus === 'responded') {
        filtered = filtered.filter(alert => alert.responseAction);
      }
    }

    // Sort alerts
    if (sortBy === 'dutyHours') {
      filtered.sort((a, b) => b.dutyHours - a.dutyHours);
    } else if (sortBy === 'time') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  };

  const filteredAlerts = getFilteredAlerts();

  // Get alert severity color and icon
  const getAlertConfig = (dutyHours) => {
    if (dutyHours >= 14) {
      return {
        level: 'critical',
        color: 'bg-red-50 border-red-200',
        badge: 'bg-red-100 text-red-800',
        icon: 'text-red-600',
        label: '14+ Hours - CRITICAL'
      };
    }
    if (dutyHours >= 11) {
      return {
        level: 'danger',
        color: 'bg-orange-50 border-orange-200',
        badge: 'bg-orange-100 text-orange-800',
        icon: 'text-orange-600',
        label: '11-14 Hours - DANGER'
      };
    }
    if (dutyHours >= 10) {
      return {
        level: 'warning',
        color: 'bg-yellow-50 border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800',
        icon: 'text-yellow-600',
        label: '10-11 Hours - WARNING'
      };
    }
    if (dutyHours >= 9) {
      return {
        level: 'alert',
        color: 'bg-blue-50 border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        icon: 'text-blue-600',
        label: '9-10 Hours - ALERT'
      };
    }
    return {
      level: 'info',
      color: 'bg-gray-50 border-gray-200',
      badge: 'bg-gray-100 text-gray-800',
      icon: 'text-gray-600',
      label: 'Info'
    };
  };

  const handleShiftDetails = (shiftId) => {
    navigate(`/dashboard/shift/${shiftId}`);
  };

  const handleRefresh = () => {
    // In socket mode, refresh means clearing alerts to see fresh data
    // or reconnecting the socket
    if (!isConnected && socketRef.current) {
      socketRef.current.connect();
    }
  };

  // Loading state
  if (isLoading && alerts.length === 0) {
    return (
      <Layout>
        <LoadingSpinner message="Loading shift alerts..." />
      </Layout>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Layout>
        <ErrorMessage
          title="Failed to Load Alerts"
          message={errorMessage}
          onRetry={handleRefresh}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#003d82] p-3 rounded-lg">
                <FaBell className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Shift Alerts</h1>
                <p className="text-gray-600 mt-1">
                  Monitor duty hour alerts across active shifts
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-6 py-2 bg-[#003d82] text-white rounded-lg hover:bg-[#002b5c] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FaFilter size={16} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p className="text-gray-600 text-sm font-medium">Total Alerts</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{alerts.length}</p>
            </div>
            <div className="bg-linear-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <p className="text-gray-600 text-sm font-medium">Pending Response</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {alerts.filter(a => !a.responseAction).length}
              </p>
            </div>
            <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <p className="text-gray-600 text-sm font-medium">Responded</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {alerts.filter(a => a.responseAction).length}
              </p>
            </div>
            <div className="bg-linear-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <p className="text-gray-600 text-sm font-medium">Critical (14+hrs)</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {alerts.filter(a => a.dutyHours >= 14).length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter by Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="7hr">7 Hour</option>
                <option value="8hr">8 Hour</option>
                <option value="9hr">9 Hour</option>
                <option value="10hr">10 Hour</option>
                <option value="11hr">11 Hour</option>
                <option value="14hr">14 Hour</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Response</option>
                <option value="responded">Responded</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
              >
                <option value="dutyHours">Highest Duty Hours</option>
                <option value="time">Most Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <EmptyState
              icon={FaBell}
              title="No Alerts"
              message={
                alerts.length === 0
                  ? 'No active duty hour alerts at the moment.'
                  : 'No alerts match your current filters.'
              }
              action={alerts.length > 0 ? () => {
                setFilterType('all');
                setFilterStatus('all');
              } : null}
              actionLabel="Clear Filters"
            />
          ) : (
            filteredAlerts.map((alert) => {
              const config = getAlertConfig(alert.dutyHours);
              const isResponded = !!alert.responseAction;

              return (
                <div
                  key={alert.id}
                  className={`${config.color} border-l-4 rounded-lg p-5 transition-all hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Alert Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FaExclamationTriangle className={`text-lg ${config.icon}`} />
                        <h3 className="text-lg font-semibold text-gray-800">
                          {alert.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
                          {alert.type.replace('DUTY_', '')}
                        </span>
                        {isResponded && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                            <FaCheckCircle size={12} />
                            Responded
                          </span>
                        )}
                      </div>

                      {/* Shift Info */}
                      <div className="bg-white bg-opacity-50 rounded p-3 mb-3 mt-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 text-xs">Train Number</p>
                            <p className="font-semibold text-gray-800">
                              #{alert.shift.trainNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Train Name</p>
                            <p className="font-semibold text-gray-800">
                              {alert.shift.trainName}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Section</p>
                            <p className="font-semibold text-gray-800">
                              {alert.shift.section}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Loco Pilot</p>
                            <p className="font-semibold text-gray-800">
                              {alert.shift.locoPilot || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Train Manager</p>
                            <p className="font-semibold text-gray-800">
                              {alert.shift.trainManager || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Locomotive</p>
                            <p className="font-semibold text-gray-800">
                              {alert.shift.locomotiveNo}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Duty Hours and Time */}
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">Duty Hours: </span>
                          <span className={`font-bold text-lg ${config.icon}`}>
                            {alert.dutyHours.toFixed(2)}h
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <FaClock size={14} />
                          <span>{dayjs(alert.createdAt).fromNow()}</span>
                        </div>
                      </div>

                      {/* Response Action if present */}
                      {isResponded && (
                        <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                          <strong>Response:</strong> {alert.responseAction}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleShiftDetails(alert.shiftId)}
                        className="px-4 py-2 bg-[#003d82] text-white rounded-lg hover:bg-[#002b5c] transition-colors text-sm font-medium whitespace-nowrap flex items-center gap-2"
                      >
                        <FaTrain size={14} />
                        View Shift
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AlertPage;