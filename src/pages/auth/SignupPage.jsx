import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrain, FaUser, FaLock, FaEnvelope, FaIdCard, FaEye, FaEyeSlash, FaBriefcase } from 'react-icons/fa';
import useToastStore from '../../stores/useToastStore';
import authService from '../../services/authService';

const SignupPage = () => {
  const navigate = useNavigate();
  const { success, error: showError, warning } = useToastStore();
  
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    phone: '',
    division: '',
    designation: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};

    // Regex patterns
    const patterns = {
      employeeId: /^[A-Z0-9]{4,10}$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[0-9]{10}$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
    };

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    // Validate employee ID
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    } else if (!patterns.employeeId.test(formData.employeeId)) {
      newErrors.employeeId = 'Employee ID must be 4-10 alphanumeric characters (uppercase)';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!patterns.email.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone
    if (formData.phone && !patterns.phone.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    // Validate division
    if (!formData.division) {
      newErrors.division = 'Division is required';
    }

    // Validate designation
    if (!formData.designation) {
      newErrors.designation = 'Designation is required';
    }

    // Validate password strength
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!patterns.password.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // If there are errors, display them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare registration data (exclude confirmPassword)
      const registrationData = {
        employeeId: formData.employeeId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        division: formData.division,
        designation: formData.designation,
        role: formData.role,
      };

      const response = await authService.register(registrationData);

      if (response.success) {
        success('Registration successful! Your account is pending approval by administrator.');
        // Navigate to login after short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle validation errors
      if (err.response?.data?.errors) {
        const errorObj = {};
        err.response.data.errors.forEach(error => {
          errorObj[error.field] = error.message;
        });
        setErrors(errorObj);
        showError(err.response.data.message || 'Registration failed. Please check the form.');
      } else {
        showError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8" style={{ background: 'linear-gradient(135deg, #003d82 0%, #0052a3 100%)' }}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FaTrain className="text-6xl text-[#003d82]" />
          </div>
          <h1 className="text-3xl font-bold text-[#003d82] mb-2">Request Access</h1>
          <p className="text-gray-600">Indian Railways - Shift Management</p>
          <div className="h-1 w-20 bg-[#d32f2f] mx-auto mt-3"></div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaIdCard className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent ${
                    errors.employeeId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your employee ID"
                  required
                />
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">📞</span>
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Division
              </label>
              <select
                name="division"
                value={formData.division}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent ${
                  errors.division ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Division</option>
                <option value="CENTRAL">CENTRAL</option>
              </select>
              {errors.division && (
                <p className="mt-1 text-sm text-red-600">{errors.division}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation
              </label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent ${
                  errors.designation ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Designation</option>
                <option value="X">X</option>
                <option value="Y">Y</option>
                <option value="Z">Z</option>
              </select>
              {errors.designation && (
                <p className="mt-1 text-sm text-red-600">{errors.designation}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requested Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
              >
                <option value="USER">User (View Only)</option>
                <option value="ADMIN">Admin (Data Entry & Management)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                SUPERADMIN will review and approve your requested role
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative h-10">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full h-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Create a password (min 6 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-gray-400 hover:text-gray-600 pointer-events-auto h-full"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              {formData.password && !errors.password && (
                <p className="mt-1 text-xs text-green-600">✓ Password is strong</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Must contain: uppercase, lowercase, numbers (min 6 characters)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative h-10">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full h-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-gray-400 hover:text-gray-600 pointer-events-auto h-full"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#003d82] text-white py-3 rounded-md hover:bg-[#002b5c] transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting Request...' : 'Request Access'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#003d82] hover:text-[#002b5c] font-medium">
              Login
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Access requests will be reviewed by the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
