interface TabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userRole: string;
}

export default function Tabs({ activeTab, setActiveTab, userRole }: TabsProps) {
    return (
        <nav className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('routing')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'routing'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Định tuyến
                    </button>
                    {(userRole === 'analyst' || userRole === 'admin') && (
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'analysis'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Phân tích & So sánh
                        </button>
                    )}
                    {userRole === 'admin' && (
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'admin'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Quản trị
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
