import React, { useState } from 'react';
import { Users, Shield, Download } from 'lucide-react';

export default function AdminPanel() {
    const [users] = useState([
        {
            id: '001',
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@company.com',
            role: 'end-user',
            lastActive: '2 giờ trước'
        },
        {
            id: '002',
            name: 'Trần Thị B',
            email: 'tranthib@company.com',
            role: 'analyst',
            lastActive: '1 ngày trước'
        }
    ]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Users className="mr-2" size={20}/>
                    Quản lý người dùng
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-2 text-left">ID</th>
                            <th className="border border-gray-300 p-2 text-left">Tên</th>
                            <th className="border border-gray-300 p-2 text-left">Email</th>
                            <th className="border border-gray-300 p-2 text-left">Vai trò</th>
                            <th className="border border-gray-300 p-2 text-left">Hoạt động cuối</th>
                            <th className="border border-gray-300 p-2 text-left">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="border border-gray-300 p-2">{user.id}</td>
                                <td className="border border-gray-300 p-2">{user.name}</td>
                                <td className="border border-gray-300 p-2">{user.email}</td>
                                <td className="border border-gray-300 p-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        user.role === 'end-user' 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : user.role === 'analyst'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-green-100 text-green-800'
                                    }`}>
                                        {user.role === 'end-user' 
                                            ? 'End User' 
                                            : user.role === 'analyst' 
                                                ? 'Analyst' 
                                                : 'Admin'
                                        }
                                    </span>
                                </td>
                                <td className="border border-gray-300 p-2">{user.lastActive}</td>
                                <td className="border border-gray-300 p-2">
                                    <button className="text-blue-600 hover:underline text-sm">Chỉnh sửa</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h4 className="font-semibold mb-4">Thống kê sử dụng</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span>Số yêu cầu hôm nay:</span>
                            <span className="font-bold">127</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tỷ lệ thành công:</span>
                            <span className="font-bold text-green-600">98.4%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Thời gian phản hồi TB:</span>
                            <span className="font-bold">2.3s</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h4 className="font-semibold mb-4">Phân quyền</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">API Routing</span>
                            <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Upload Algorithm</span>
                            <input type="checkbox" className="rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Compare Results</span>
                            <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h4 className="font-semibold mb-4">Bảo mật</h4>
                    <div className="space-y-3">
                        <button className="w-full bg-yellow-600 text-white p-2 rounded-md hover:bg-yellow-700 text-sm">
                            Kích hoạt 2FA
                        </button>
                        <button className="w-full bg-red-600 text-white p-2 rounded-md hover:bg-red-700 text-sm">
                            Reset Password
                        </button>
                        <button className="w-full bg-gray-600 text-white p-2 rounded-md hover:bg-gray-700 text-sm">
                            Xuất Log hoạt động
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}