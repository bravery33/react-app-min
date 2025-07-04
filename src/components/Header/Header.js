import React, { useState } from 'react';
import './Header.css';

// onSearch prop을 받아옵니다.
const Header = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // form의 기본 새로고침 동작을 막습니다.
    onSearch(query);
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-purple-500/10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white cursor-pointer" onClick={() => window.location.reload()}>
          <span className="text-purple-400">Movie</span> Archive
        </h1>
        
        {/* ★★★ 검색창 form 추가 ★★★ */}
        <form onSubmit={handleSubmit} className="w-1/3">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="영화를 검색하세요..."
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </form>
      </div>
    </header>
  );
};

export default Header;