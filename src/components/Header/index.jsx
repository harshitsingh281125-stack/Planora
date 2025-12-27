import React from 'react';
import { ArrowLeftIcon, BotMessageSquare, SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ title, backButton, settingsButton, onClickAI, secondaryTitle }) => {
  const navigate = useNavigate();
  return <div className="flex flex-row justify-between w-full bg-white py-4 px-6 rounded-b-2xl shadow-md">
    <div className='flex flex-row gap-4'>
      {backButton && <ArrowLeftIcon className="w-5 h-5 text-gray-800 cursor-pointer self-center" onClick={() => navigate(-1)} />}
      <div className='flex flex-col'>
        <h1 className="text-2xl text-black font-sans-serif">{title || 'Planora'}</h1>
        <p className="text-sm text-gray-800 font-bold">{secondaryTitle}</p>
      </div>
    </div>
    {onClickAI && <div className="bg-transparent text-black py-2 px-4 rounded-2xl cursor-pointer self-start flex flex-row items-center gap-2 border border-gray-200" onClick={onClickAI}>
      <BotMessageSquare className="w-4 h-4 text-black" /> <span className="text-black font-medium text-sm">AI Assist</span>
    </div>}
    {settingsButton && <SettingsIcon className="w-6 h-6 text-black cursor-pointer" onClick={() => { console.log('settings') }} />}
  </div>
};

export default Header;