import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../components/common/hooks/useFormValidation';
import { validationSchemas } from '../components/common/validations/validationSchemas';
import FormWrapper from '../components/common/ui/FormWrapper';
import FormField from '../components/common/ui/FormField';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleSignIn, appleSignIn } = useAuth();
  const navigate = useNavigate();

  // Form validation
  const loginForm = useFormValidation(validationSchemas.auth.login);

  const handleLoginSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/redirect');
      } else if (result.needsVerification) {
        toast.error('Please verify your email address before logging in.');
        navigate('/waiting-verification', { 
          state: { 
            email: data.email,
            fromLogin: true 
          } 
        });
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Failed to log in');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result.success) {
        toast.success('Google sign-in successful!');
        navigate('/redirect');
      } else {
        toast.error(result.error || 'Google sign-in failed');
      }
    } catch (err) {
      toast.error('Failed to sign in with Google');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const result = await appleSignIn();
      if (result.success) {
        toast.success('Apple sign-in successful!');
        navigate('/redirect');
      } else {
        toast.error(result.error || 'Apple sign-in failed');
      }
    } catch (err) {
      toast.error('Failed to sign in with Apple');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Agriculture Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1920&q=80"
          alt="Smart Agriculture"
          className="w-full h-full object-cover blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5E9]/20 via-[#F1F8E9]/15 to-[#E8F5E9]/20" />
      </div>

      {/* Login Container */}
      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-[#2E7D32] tracking-wide drop-shadow-sm">
            SmartAgro
          </h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-700">
            Sign in to continue to your smart farming dashboard
          </p>
        </div>

        {/* Glassy Login Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl p-8">
          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-lg text-sm font-medium text-gray-800 hover:bg-white/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <FcGoogle className="w-5 h-5 mr-3" />
              Sign in with Google
            </button>

            <button
              onClick={handleAppleSignIn}
              className="w-full flex items-center justify-center px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-lg text-sm font-medium text-gray-800 hover:bg-white/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <FaApple className="w-5 h-5 mr-3" />
              Sign in with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white/30 backdrop-blur-sm rounded-full text-gray-700 font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <FormWrapper
            form={loginForm}
            onSubmit={handleLoginSubmit}
            submitButtonText="Sign in"
            showSubmitButton={false}
          >
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Address
                </label>
                <FormField
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FormField
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-400 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-800">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-green-700 hover:text-green-800 transition-colors duration-300 ease-in-out"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Login Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!loginForm.canSubmit || loginForm.isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {loginForm.isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </div>
          </FormWrapper>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-800">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-green-700 hover:text-green-800 transition-colors duration-300 ease-in-out"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
