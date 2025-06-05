import React from 'react';
import { Truck, Shield } from 'lucide-react';

interface HeaderProps {
    userRole: string;
    setUserRole: (role: string) => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, setUserRole }) => (
    <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                    <Truck className="h-8 w-8 text-blue-600 mr-3" />
                    <h1 className="text-xl font-bold">VRP Routing Optimizer</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                        <option value="end-user">End User</option>
                        <option value="analyst">Analyst</option>
                        <option value="admin">Admin</option>
                    </select>
                    <div className="flex items-center text-sm text-gray-600">
                        <Shield className="h-4 w-4 mr-1" />
                        <span>Dư Vũ Mạnh Đức</span>
                    </div>
                </div>
            </div>
        </div>
    </header>
);

export default Header;