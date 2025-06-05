import React from 'react';

const Footer: React.FC = () => (
    <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    {/* © 2025 HUST - Đại học Bách khoa Hà Nội */}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>•</span>
                    <span>Version: 1.0</span>
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;