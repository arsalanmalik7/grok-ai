import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png'

const Landing = () => {
  const [showUpgrade, setShowUpgrade] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleGetStarted = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-4 sm:px-6 py-4">
        <img src={logo} className="w-10 h-10 sm:w-14 sm:h-14" alt="logo" />
  
        <div className="flex gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-gray-900 text-sm sm:text-base"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm sm:text-base"
          >
            Sign up
          </button>
        </div>
      </header>
  
      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 px-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <img src={logo} className="w-16 h-16 sm:w-24 sm:h-24" alt="logo" />
          <div className="text-4xl sm:text-6xl font-bold mb-1">MagnaAI</div>
        </div>
  
        {/* Search Bar */}
        <div className="w-full max-w-lg sm:max-w-2xl mb-8">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-gray-200">
            <input
              type="text"
              placeholder="What do you want to know?"
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
            />
  
            <select className="bg-transparent border-none outline-none text-gray-600 text-xs sm:text-sm">
              <option>Auto</option>
            </select>
  
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>
  
        {/* Upgrade Popup */}
        {showUpgrade && (
          <div className="w-full max-w-xl sm:max-w-3xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 sm:p-6 mb-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  MagnaAI Imagine Upgrades
                </h3>
  
                <p className="text-gray-300 mb-4 text-sm sm:text-base">
                  Generate videos with built-in audio - plus enhanced lifelike motion and character consistency
                </p>
  
                <div className="flex flex-col sm:flex-row sm:justify-start justify-center gap-3">
                  <button
                    onClick={handleGetStarted}
                    className="px-5 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100"
                  >
                    Sign up
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-5 py-2 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10"
                  >
                    Sign in
                  </button>
                </div>
              </div>
  
              <div className="w-full md:w-64 h-40 sm:h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <p className="text-xs sm:text-sm">Video Preview</p>
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* Get Started Button */}
        <button
          onClick={handleGetStarted}
          className="px-6 sm:px-8 py-2.5 sm:py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition text-sm sm:text-base"
        >
          Get Started
        </button>
      </main>
    </div>
  );
  
};

export default Landing;

