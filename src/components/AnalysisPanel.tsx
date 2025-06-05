import React, { useState } from 'react';

export default function AnalysisPanel() {
    const [algorithms] = useState([
        {id: 'harmony-search', name: 'Harmony Search (Cải tiến)', type: 'meta-heuristic'},
        {id: 'guided-local-search', name: 'Guided Local Search', type: 'heuristic'},
        {id: 'genetic-algorithm', name: 'Genetic Algorithm', type: 'meta-heuristic'},
        {id: 'particle-swarm', name: 'Particle Swarm Optimization', type: 'meta-heuristic'},
        {id: 'clarke-wright', name: 'Clarke-Wright Savings', type: 'heuristic'}
    ]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">So sánh thuật toán</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-4">Tùy chỉnh thuật toán</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Harmony Search - HMCR</label>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="1" 
                                    step="0.1" 
                                    defaultValue="0.7"
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>0.1</span>
                                    <span>1.0</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Genetic Algorithm - Population Size</label>
                                <input 
                                    type="number" 
                                    defaultValue="100"
                                    min="10" 
                                    max="500"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Maximum Iterations</label>
                                <input 
                                    type="number" 
                                    defaultValue="1000"
                                    min="100" 
                                    max="5000"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <button className="w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700">
                                Tải lên thuật toán tùy chỉnh (Python)
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-4">Kết quả so sánh</h4>
                        <div className="space-y-2">
                            {algorithms.slice(0, 3).map((alg, index) => (
                                <div key={alg.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">{alg.name}</span>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{(150 + index * 5).toFixed(1)} km</div>
                                        <div className="text-xs text-gray-600">{(2.5 + index * 0.3).toFixed(1)}s</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Độ hội tụ</h4>
                            <div className="h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                                <div className="text-gray-500 text-sm">
                                    Biểu đồ hội tụ sẽ hiển thị tại đây
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0 s</span>
                                <span>Iterations</span>
                                <span>3.0 s</span>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                            <button className="flex-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 text-sm">
                                Chạy so sánh
                            </button>
                            <button className="flex-1 bg-green-600 text-white p-2 rounded-md hover:bg-green-700 text-sm">
                                Xuất báo cáo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Thống kê tổng hợp</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">3,752</div>
                        <div className="text-sm text-gray-600">Số yêu cầu định tuyến</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">143.2 km</div>
                        <div className="text-sm text-gray-600">Quãng đường trung bình</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">2.4s</div>
                        <div className="text-sm text-gray-600">Thời gian tính toán TB</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">97.8%</div>
                        <div className="text-sm text-gray-600">Độ chính xác</div>
                    </div>
                </div>
                
                <div className="h-64 bg-gray-100 rounded-lg border flex items-center justify-center">
                    <div className="text-gray-500">
                        Biểu đồ xu hướng hiệu suất theo thời gian sẽ hiển thị tại đây
                    </div>
                </div>
            </div>
        </div>
    );
}