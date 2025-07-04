import React from 'react';
import './Header.css';

const Header = () => (
  <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-purple-500/10">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <h1 className="text-2xl md:text-3xl font-bold text-white">
        <span className="text-purple-400">Movie</span> Archive
      </h1>
      <p className="text-sm text-gray-400 hidden md:block">당신이 놓친 명작을 다시 만나보세요</p>
    </div>
  </header>
);

export default Header;