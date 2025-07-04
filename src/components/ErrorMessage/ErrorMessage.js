import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message }) => (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white p-4">
        <div className="bg-red-900/50 border border-red-500 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-400">오류가 발생했습니다</h2>
            <p className="text-red-300">{message}</p>
            <p className="mt-4 text-sm text-gray-400">API 키가 정확한지, 인터넷 연결이 안정적인지 확인해주세요.</p>
        </div>
    </div>
);

export default ErrorMessage;