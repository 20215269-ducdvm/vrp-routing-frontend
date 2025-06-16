import React, {useRef} from 'react';
import {Download, Play, Settings, Upload} from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import CustomerTable from './CustomerTable';
import {Location, SolutionData, Vehicle} from '../types/types';

interface RoutingInterfaceProps {
    problemType: string;
    setProblemType: (val: string) => void;
    algorithm: string;
    setAlgorithm: (val: string) => void;
    vehicles: Vehicle[];
    setVehicles: (v: Vehicle[]) => void;
    locations: Location[];
    setLocations: (locations: Location[]) => void;
    isCalculating: boolean;
    results: SolutionData | null;
    onCalculate: () => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    uploadStatus: string;
    onSampleLoad: () => void;
}

export default function RoutingInterface(props: RoutingInterfaceProps) {
    const {
        problemType,
        setProblemType,
        algorithm,
        setAlgorithm,
        vehicles,
        setVehicles,
        locations,
        setLocations,
        isCalculating,
        results,
        onCalculate,
        onUpload,
        uploadStatus,
        onSampleLoad
    } = props;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);
    const [editingLocation, setEditingLocation] = React.useState<Location | null>(null);
    const [mapCenter, setMapCenter] = React.useState({lat: 21.0285, lon: 105.8542});
    const [mapZoom, setMapZoom] = React.useState(13);

    // Helper functions to work with the combined locations state
    const getDepot = (): Location | null => locations.length > 0 ? locations[0] : null;
    const getCustomers = () => locations.length > 0 ? locations.slice(1) : [];

    const updateDepot = (depot: Location) => {
        setLocations([{...depot, type: 'depot'}, ...locations.slice(1)]);
    };

    const updateCustomers = (newCustomers: Location[]) => {
        if (locations.length > 0) {
            setLocations([locations[0], ...newCustomers]);
        } else {
            setLocations([...newCustomers]);
        }
    };

    // Define algorithms with detailed information
    const algorithms = [
        {id: 'harmony-search', name: 'Harmony Search (Cải tiến)', type: 'meta-heuristic'},
        {id: 'guided-local-search', name: 'Guided Local Search', type: 'heuristic'},
        {id: 'genetic-algorithm', name: 'Genetic Algorithm', type: 'meta-heuristic'},
        {id: 'particle-swarm', name: 'Particle Swarm Optimization', type: 'meta-heuristic'},
        {id: 'clarke-wright', name: 'Clarke-Wright Savings', type: 'heuristic'}
    ];

    // Map interaction handlers
    const handleLocationEdit = (location: Location) => {
        setEditingLocation(location);
    };

    const handleLocationDelete = (locationId: string | number) => {
        const customers = getCustomers();
        const deletedCustomer = customers.find(c => c.id === locationId);

        // Store for potential undo (BEFORE changing the state)
        const deletedState = [...customers];

        // Filter out the customer to delete and update the locations
        updateCustomers(customers.filter(c => c.id !== locationId));

        if (selectedLocation?.id === locationId) {
            setSelectedLocation(null);
        }

        // Show toast with undo option
        const toastContainer = document.createElement('div');
        toastContainer.className = 'bg-red-500 text-white px-4 py-2 rounded fixed bottom-4 right-4 z-50 shadow-lg flex items-center';
        toastContainer.innerHTML = `
          <span>Đã xóa ${deletedCustomer?.name || 'địa điểm'}!</span>
          <button id="undo-delete" class="ml-3 px-2 py-1 bg-white text-red-500 rounded text-xs font-bold">HOÀN TÁC</button>
        `;

        document.body.appendChild(toastContainer);

        // Add undo functionality
        document.getElementById('undo-delete')?.addEventListener('click', () => {
            updateCustomers(deletedState);
            document.body.removeChild(toastContainer);
        });

        // Remove toast after delay
        setTimeout(() => {
            if (document.body.contains(toastContainer)) {
                document.body.removeChild(toastContainer);
            }
        }, 10000);
    };

    const updateMapCenter = (location: Location) => {
        setMapCenter({lat: location.lat, lon: location.lon});
        setMapZoom(15);
    };

    // Export functions
    const exportToPDF = () => {
        if (!results) return;

        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kết quả định tuyến VRP</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; }
          .route { margin: 15px 0; padding: 10px; border-left: 4px solid #3b82f6; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Kết quả Tối ưu hóa Định tuyến</h1>
          <p>Loại bài toán: ${problemType}</p>
        </div>

        <div class="stats">
          <div class="stat-box">
            <h3>${results.totalDistance} m</h3>
            <p>Tổng quãng đường</p>
          </div>
          <div class="stat-box">
            <h3>${results.vehiclesUsed}</h3>
            <p>Số xe sử dụng</p>
          </div>
          <div class="stat-box">
            <h3>${results.totalTime} phút</h3>
            <p>Tổng thời gian</p>
          </div>
        </div>

        <h2>Chi tiết lộ trình</h2>
        ${results.routes.map(route => `
          <div class="route">
            <h3>Xe ${route.vehicleId}</h3>
            <p>Khoảng cách: ${route.distance} m | Tải trọng: ${route.load}</p>
            <p>Lộ trình: ${route.customers.map(point => point?.name || 'Unknown').join(' → ')}</p>
          </div>
        `).join('')}
      </body>
      </html>
    `;

        const blob = new Blob([htmlContent], {type: 'text/html'});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vrp-results-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        alert('File HTML đã được tải xuống. Bạn có thể mở file này trong trình duyệt và in thành PDF.');
    };

    const exportToGeoJSON = () => {
        if (!results) return;

        const features = [];
        const depot = getDepot();
        const customers = getCustomers();

        if (depot) {
            features.push({
                type: 'Feature',
                properties: {
                    type: 'depot',
                    name: depot.name,
                    id: depot.id
                },
                geometry: {
                    type: 'Point',
                    coordinates: [depot.lon, depot.lat]
                }
            });
        }

        customers.forEach(customer => {
            features.push({
                type: 'Feature',
                properties: {
                    type: 'customer',
                    name: customer.name,
                    id: customer.id,
                    demand: customer.demand,
                    timeWindow: customer.timeWindow
                },
                geometry: {
                    type: 'Point',
                    coordinates: [customer.lon, customer.lat]
                }
            });
        });

        results.routes.forEach((route, index) => {
            const coordinates = route.customers
                .filter(point => point !== null)
                .map(point => [point!.lon, point!.lat]);

            if (coordinates.length > 1) {
                features.push({
                    type: 'Feature',
                    properties: {
                        type: 'route',
                        vehicleId: route.vehicleId,
                        distance: route.distance,
                        load: route.load,
                        routeIndex: index
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates
                    }
                });
            }
        });

        const geojson = {
            type: 'FeatureCollection',
            features,
            properties: {
                totalDistance: results.totalDistance,
                totalTime: results.totalTime,
                vehiclesUsed: results.vehiclesUsed,
                generatedAt: new Date().toISOString()
            }
        };

        const blob = new Blob([JSON.stringify(geojson, null, 2)], {type: 'application/json'});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vrp-routes-${new Date().toISOString().split('T')[0]}.geojson`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Upload className="mr-2" size={20}/>
                            Nhập dữ liệu
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={onUpload}
                                accept=".csv,.json,.geojson"
                                className="hidden"
                                id="file-upload"
                            />

                            <label
                                htmlFor="file-upload"
                                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors cursor-pointer flex flex-col items-center"
                            >
                                <Upload className="mb-2" size={24}/>
                                <span className="text-sm">Tải lên file CSV/JSON/GeoJSON</span>
                            </label>

                            {uploadStatus && (
                                <div className={`text-sm p-2 rounded ${
                                    uploadStatus.includes('thành công')
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {uploadStatus}
                                </div>
                            )}

                            <div className="text-center text-gray-500">hoặc</div>

                            <button
                                onClick={onSampleLoad}
                                className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
                            >
                                Sử dụng dữ liệu mẫu Hà Nội
                            </button>

                            <div className="border-t pt-4">
                                <p className="text-sm font-medium mb-2">Xuất cấu hình hiện tại:</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const problemData = {
                                                problemType,
                                                algorithm,
                                                depot: getDepot(),
                                                customers: getCustomers(),
                                                vehicles,
                                                createdAt: new Date().toISOString()
                                            };

                                            const blob = new Blob([JSON.stringify(problemData, null, 2)], {type: 'application/json'});
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `vrp-problem-${new Date().toISOString().split('T')[0]}.json`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(url);
                                        }}
                                        className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                                    >
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => {
                                            const customers = getCustomers();
                                            if (!customers.length) return;

                                            let csvContent = 'ID,Name,Latitude,Longitude,Demand';
                                            if (problemType === 'VRPTW') {
                                                csvContent += ',Time window start,Time window end';
                                            }
                                            csvContent += '\n';

                                            customers.forEach(customer => {
                                                csvContent += `${customer.id},"${customer.name}",${customer.lat},${customer.lon},${customer.demand}`;
                                                if (problemType === 'VRPTW' && customer.timeWindow) {
                                                    csvContent += `,${customer.timeWindow[0]},${customer.timeWindow[1]}`;
                                                }
                                                csvContent += '\n';
                                            });

                                            const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `vrp-customers-${new Date().toISOString().split('T')[0]}.csv`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(url);
                                        }}
                                        className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                                    >
                                        CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">📋 Hướng dẫn sử dụng bản đồ:</h4>
                        {editingLocation ? (
                            <div className="text-orange-700 font-medium">
                                📍 Đang chỉnh sửa "{editingLocation.name}" - Click trên bản đồ hoặc kéo thả marker để di chuyển
                                vị trí mới
                            </div>
                        ) : (
                            <div className="space-y-1 text-blue-700 text-sm">
                                <div>• <strong>Tìm kiếm địa điểm</strong> bằng thanh tìm kiếm phía trên (hỗ trợ tiếng Việt có
                                    dấu)
                                </div>
                                <div>• <strong>Click vào marker</strong> để xem chi tiết và thao tác</div>
                                <div>• <strong>Marker đỏ = Kho</strong>, <strong>Marker xanh = Khách hàng</strong></div>
                                <div>• Di chuyển bản đồ bằng cách kéo thả, phóng to/thu nhỏ bằng chuột hoặc nút zoom</div>
                                <div>• Sử dụng nút "🏠" để quay lại vị trí kho chính</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <InteractiveMap
                            locations={locations}
                            setLocations={setLocations}
                            results={results}
                            editingLocation={editingLocation}
                            selectedLocation={selectedLocation}
                            setEditingLocation={setEditingLocation as (loc: Location | null) => void}
                            setSelectedLocation={setSelectedLocation as (loc: Location | null) => void}
                            mapCenter={mapCenter}
                            mapZoom={mapZoom}
                            setMapCenter={setMapCenter}
                            setMapZoom={setMapZoom}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Danh sách khách hàng ({getCustomers().length} điểm)</h3>
                    <button
                        onClick={onCalculate}
                        disabled={isCalculating || getCustomers().length === 0}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                    >
                        {isCalculating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang tính toán...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2" size={16}/>
                                Tính toán định tuyến
                            </>
                        )}
                    </button>
                </div>

                <CustomerTable
                    customers={getCustomers()}
                    problemType={problemType}
                    handleLocationEdit={handleLocationEdit}
                    handleLocationDelete={handleLocationDelete}
                    updateMapCenter={updateMapCenter}
                />
            </div>

            {results && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Settings className="mr-2" size={20}/>
                        Kết quả định tuyến
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{results.totalDistance} m</div>
                            <div className="text-sm text-gray-600">Tổng quãng đường</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{results.vehiclesUsed}</div>
                            <div className="text-sm text-gray-600">Số xe sử dụng</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{results.totalTime} phút</div>
                            <div className="text-sm text-gray-600">Tổng thời gian</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <div
                                className="text-2xl font-bold text-orange-600">{results.algorithmStats.executionTime}s
                            </div>
                            <div className="text-sm text-gray-600">Thời gian tính toán</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold">Chi tiết lộ trình:</h4>
                        {results.routes.map((route, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-medium text-lg">
                                        <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
                                            index === 0 ? 'bg-red-500' : 'bg-blue-500'
                                        }`}></span>
                                        Xe {route.vehicleId}
                                    </h5>
                                    <div className="text-sm text-gray-600">
                                        {route.distance} m •
                                        {/*{route.duration || 0} phút • */}
                                        Tải: {route.load}
                                    </div>
                                </div>
                                <div className="text-sm bg-gray-50 p-2 rounded">
                                    <span className="font-medium">Lộ trình: </span>
                                    {route.customers.map((point, idx) => (
                                        <span key={idx}>
                                            {point?.name || 'Unknown'}
                                            {idx < route.customers.length - 1 && ' → '}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 mt-6 flex-wrap">
                        <button
                            onClick={exportToPDF}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                        >
                            <Download className="mr-2" size={16}/>
                            Xuất PDF (HTML)
                        </button>
                        <button
                            onClick={exportToGeoJSON}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                        >
                            <Download className="mr-2" size={16}/>
                            Xuất GeoJSON
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}