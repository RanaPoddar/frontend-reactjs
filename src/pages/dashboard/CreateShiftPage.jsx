import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaTrain, FaUser, FaClock, FaCalendarAlt, FaSave } from 'react-icons/fa';
import dayjs from 'dayjs';
import useAuthStore from '../../stores/useAuthStore';
import useToastStore from '../../stores/useToastStore';
import shiftService from '../../services/shiftService';

const CreateShiftPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { success, error: showError } = useToastStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Train Information
    trainNumber: '',
    trainName: '',
    locomotiveNo: '',
    signOnStation: '',
    section: '',
    
    // Combined datetime fields
    trainArrivalDateTime: '',
    signOnDateTime: '',
    timeOfTO: '',
    departureDateTime: '',
    
    // Loco Pilot Information
    locoPilotName: '',
    locoPilotId: '',
    locoPilotPhone: '',
    
    // Train Manager/Guard Information
    trainManagerName: '',
    trainManagerId: '',
    trainManagerPhone: '',
    
    // Additional Information
    remarks: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Phone number validation helper
  const isValidPhone = (phone) => {
    if (!phone) return true; // Phone is optional
    // Accept 10 digits or +91 followed by 10 digits
    const phoneRegex = /^(\+91[\s]?)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate contact numbers
      if (formData.locoPilotPhone && !isValidPhone(formData.locoPilotPhone)) {
        showError('Loco Pilot contact number must be a valid 10-digit Indian mobile number (optionally with +91 prefix)!');
        setIsSubmitting(false);
        return;
      }
      
      if (formData.trainManagerPhone && !isValidPhone(formData.trainManagerPhone)) {
        showError('Train Manager contact number must be a valid 10-digit Indian mobile number (optionally with +91 prefix)!');
        setIsSubmitting(false);
        return;
      }
      
      // Validate required time fields
      if (!formData.trainArrivalDateTime) {
        showError('Train arrival date-time is required!');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.signOnDateTime) {
        showError('Sign-on date-time is required!');
        setIsSubmitting(false);
        return;
      }
      
      // Validate sign-on time is after train arrival
      const trainArrival = dayjs(formData.trainArrivalDateTime);
      const signOn = dayjs(formData.signOnDateTime);
      
      if (!trainArrival.isValid() || !signOn.isValid()) {
        showError('Invalid date or time format!');
        setIsSubmitting(false);
        return;
      }
      
      if (signOn.isBefore(trainArrival)) {
        showError('Sign-on date-time cannot be before train arrival date-time!');
        setIsSubmitting(false);
        return;
      }
      
      // Validate departure time if provided
      if (formData.departureDateTime) {
        const departure = dayjs(formData.departureDateTime);
        if (!departure.isValid()) {
          showError('Invalid departure date-time format!');
          setIsSubmitting(false);
          return;
        }
        if (departure.isBefore(signOn)) {
          showError('Departure date-time cannot be before sign-on date-time!');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Validate timeOfTO if provided
      if (formData.timeOfTO) {
        const timeOfTO = dayjs(formData.timeOfTO);
        if (!timeOfTO.isValid()) {
          showError('Invalid Time of TO date-time format!');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Prepare shift data matching backend validators
      const shiftData = {
        trainNumber: formData.trainNumber,
        trainName: formData.trainName || undefined, // Optional field
        locomotiveNo: formData.locomotiveNo,
        signOnStation: formData.signOnStation,
        section: formData.section,
        
        // ISO 8601 datetime fields
        trainArrivalDateTime: formData.trainArrivalDateTime
          ? dayjs(formData.trainArrivalDateTime).toISOString()
          : undefined,
        signOnDateTime: formData.signOnDateTime
          ? dayjs(formData.signOnDateTime).toISOString()
          : undefined,
        timeOfTO: formData.timeOfTO 
          ? dayjs(formData.timeOfTO).toISOString()
          : undefined,
        departureDateTime: formData.departureDateTime 
          ? dayjs(formData.departureDateTime).toISOString()
          : undefined,
        
        locoPilot: {
          name: formData.locoPilotName,
          employeeId: formData.locoPilotId,
          phone: formData.locoPilotPhone || undefined,
        },
        trainManager: {
          name: formData.trainManagerName,
          employeeId: formData.trainManagerId,
          phone: formData.trainManagerPhone || undefined,
        },
      };
      
      // Log the data being sent for debugging
      console.log('Sending shift data:', JSON.stringify(shiftData, null, 2));
      
      // Call API to create shift
      const response = await shiftService.createShift(shiftData);
      
      console.log('Shift created:', response);
      
      // Show success message
      success(`Shift created for Train ${formData.trainNumber}! Tracking started.`);
      
      // Navigate after short delay
      setTimeout(() => {
        navigate('/dashboard/active-shifts');
      }, 500);
      
    } catch (err) {
      console.error('Error creating shift:', err);
      showError(err.response?.data?.message || 'Failed to create shift. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the form?')) {
      setFormData({
        trainNumber: '',
        trainName: '',
        locomotiveNo: '',
        signOnStation: '',
        section: '',
        trainArrivalDateTime: '',
        signOnDateTime: '',
        timeOfTO: '',
        departureDateTime: '',
        locoPilotName: '',
        locoPilotId: '',
        locoPilotPhone: '',
        trainManagerName: '',
        trainManagerId: '',
        trainManagerPhone: '',
        remarks: '',
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#003d82] flex items-center gap-3">
            <FaTrain />
            Create New Shift
          </h2>
          <p className="text-gray-600 mt-2">
            Enter shift details to start tracking duty hours for loco pilot and train manager
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Train Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4 flex items-center gap-2">
              <FaTrain className="text-lg" />
              Train Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="trainNumber"
                  value={formData.trainNumber}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., 12345"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Name
                </label>
                <input
                  type="text"
                  name="trainName"
                  value={formData.trainName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., Rajdhani Express"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sign On Station <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="signOnStation"
                  value={formData.signOnStation}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., New Delhi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locomotive Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locomotiveNo"
                  value={formData.locomotiveNo}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., WAP-7 30356"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Arrival Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="trainArrivalDateTime"
                  value={formData.trainArrivalDateTime}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sign On Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="signOnDateTime"
                  value={formData.signOnDateTime}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time of TO (Turn Out)
                </label>
                <input
                  type="datetime-local"
                  name="timeOfTO"
                  value={formData.timeOfTO}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="departureDateTime"
                  value={formData.departureDateTime}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., New Delhi - Mumbai Central"
                  required
                />
              </div>
            </div>
          </div>

          {/* Loco Pilot Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4 flex items-center gap-2">
              <FaUser className="text-lg" />
              Loco Pilot Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loco Pilot Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locoPilotName"
                  value={formData.locoPilotName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loco Pilot ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locoPilotId"
                  value={formData.locoPilotId}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="Enter employee ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="locoPilotPhone"
                  value={formData.locoPilotPhone}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="+91 98765 43210"
                  pattern="(\+91[\s]?)?[6-9]\d{9}"
                  title="Enter a valid 10-digit Indian mobile number (e.g., 9876543210 or +91 9876543210)"
                />
              </div>
            </div>
          </div>

          {/* Train Manager/Guard Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4 flex items-center gap-2">
              <FaUser className="text-lg" />
              Train Manager / Guard Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Manager Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="trainManagerName"
                  value={formData.trainManagerName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Manager ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="trainManagerId"
                  value={formData.trainManagerId}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="Enter employee ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="trainManagerPhone"
                  value={formData.trainManagerPhone}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="+91 98765 43211"
                  pattern="(\+91[\s]?)?[6-9]\d{9}"
                  title="Enter a valid 10-digit Indian mobile number (e.g., 9876543211 or +91 9876543211)"
                />
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4">
              Additional Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks / Notes
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="4"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                placeholder="Add any additional notes or remarks about this shift..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end bg-white rounded-lg shadow-md p-6">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors font-medium flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FaSave />
              {isSubmitting ? 'Creating Shift...' : 'Create Shift & Start Tracking'}
            </button>
          </div>
        </form>

        {/* Information Box */}
        <div className="mt-6 bg-blue-50 border-l-4 border-[#003d82] p-4 rounded">
          <div className="flex items-start">
            <FaClock className="text-[#003d82] mt-1 mr-3" />
            <div>
              <h4 className="font-bold text-[#003d82]">Duty Hours Tracking</h4>
              <p className="text-sm text-gray-700 mt-1">
                Once the shift is created, the system will automatically track duty hours from Sign On Time to Release Time.
                Notifications will be sent at 8hr, 9hr, 11hr, 12hr, and 14hr intervals with options for relief planning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateShiftPage;
