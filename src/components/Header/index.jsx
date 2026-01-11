import React, { useState } from 'react';
import { ArrowLeftIcon, SettingsIcon, Sparkles, LogOut, ChevronDown, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ title, backButton, settingsButton, onClickAI, secondaryTitle, onShare, isSharedView }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex flex-row justify-between w-full bg-white py-4 px-6 rounded-b-2xl shadow-md">
      <div className='flex flex-row gap-4'>
        {backButton && <ArrowLeftIcon className="w-5 h-5 text-gray-800 cursor-pointer self-center" onClick={() => navigate(-1)} />}
        <div className='flex flex-col'>
          <h1 className="text-2xl text-black font-sans-serif">{title || 'Planora'}</h1>
          <p className="text-sm text-gray-800 font-bold">{secondaryTitle}</p>
        </div>
      </div>
      <div className="flex flex-row items-center gap-3">
        {onClickAI && !isSharedView && (
          <div 
            className="bg-transparent text-black py-2 px-4 rounded-2xl cursor-pointer flex flex-row items-center gap-2 border border-gray-200" 
            onClick={onClickAI}
          >
            <Sparkles className="w-4 h-4 text-black" /> 
            <span className="text-black font-medium text-sm">AI Assist</span>
          </div>
        )}
        {onShare && !isSharedView && (
          <button
            className="bg-transparent text-black py-2 px-4 rounded-2xl cursor-pointer flex flex-row items-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={onShare}
            title="Share trip"
          >
            <Share2 className="w-4 h-4 text-black" /> 
            <span className="text-black font-medium text-sm">Share</span>
          </button>
        )}
        {settingsButton && <SettingsIcon className="w-6 h-6 text-black cursor-pointer" onClick={() => { console.log('settings') }} />}
        
        {user && !isSharedView && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors py-2 px-3 rounded-xl"
            >
              <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getUserInitial()}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {getUserInitial()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Planora User
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
