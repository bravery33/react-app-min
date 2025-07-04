import React from 'react';
import './Footer.css';

const Footer = () => (
    <footer className="bg-gray-900 border-t border-gray-800 mt-12">
        <div className="container mx-auto py-6 px-4 text-center text-gray-500">
            <p>Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">TMDb</a> and <a href="https://www.kobis.or.kr/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">KOBIS</a></p>
            <p className="text-sm mt-2">This product uses the TMDb API but is not endorsed or certified by TMDb.</p>
        </div>
    </footer>
);

export default Footer;