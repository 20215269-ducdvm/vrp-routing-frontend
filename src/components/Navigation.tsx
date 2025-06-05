import React from 'react';
import { MapPin, BarChart3, Users } from 'lucide-react';

interface NavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userRole: string;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, userRole }) => (
    <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
                <button
                    onClick={() => setActiveTab('routing')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'routing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                    }`}
                >
                    <MapPin className="inline-block mr-2" size={16} />
                    Routing
                </button>
                {(userRole === 'analyst' || userRole === 'admin') && (
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'analysis' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                        }`}
                    >
                        <BarChart3 className="inline-block mr-2" size={16} />
                        Analysis
                    </button>
                )}
                {userRole === 'admin' && (
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'admin' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                        }`}
                    >
                        <Users className="inline-block mr-2" size={16} />
                        Admin
                    </button>
                )}
            </div>
        </div>
    </nav>
);

export default Navigation;