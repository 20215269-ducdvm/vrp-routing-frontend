import {useEffect, useState} from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Footer from './components/Footer';
import RoutingInterface from './components/RoutingInterface';
import AnalysisPanel from './components/AnalysisPanel';
import AdminPanel from './components/AdminPanel';
import {Location, RoutingResults, Vehicle} from './types/types';
import {handleCSVUpload, handleGeoJSONUpload, handleJSONUpload} from './utils/fileHandlers';

const sampleLocations: Location[] = [
    {id: 'depot', lat: 21.0285, lng: 105.8542, name: 'Kho chính', type: 'depot'},
    {id: 1, lat: 21.0245, lng: 105.8412, name: 'Khách hàng 1 - Hoàn Kiếm', demand: 15, timeWindow: [8, 10]},
    {id: 2, lat: 21.0325, lng: 105.8372, name: 'Khách hàng 2 - Ba Đình', demand: 25, timeWindow: [9, 11]},
    {id: 3, lat: 21.0185, lng: 105.8502, name: 'Khách hàng 3 - Hai Bà Trưng', demand: 20, timeWindow: [10, 12]},
    {id: 4, lat: 21.0365, lng: 105.8602, name: 'Khách hàng 4 - Đống Đa', demand: 30, timeWindow: [11, 13]},
    {id: 5, lat: 21.0205, lng: 105.8282, name: 'Khách hàng 5 - Tây Hồ', demand: 18, timeWindow: [13, 15]},
];

export default function App() {
    const [activeTab, setActiveTab] = useState('routing');
    const [userRole, setUserRole] = useState('end-user');

    const [problemType, setProblemType] = useState('CVRP');
    const [algorithm, setAlgorithm] = useState('harmony-search');
    const [vehicles, setVehicles] = useState<Vehicle[]>([{id: 1, capacity: 100}, {id: 2, capacity: 80}]);
    const [depotLocation, setDepotLocation] = useState<Location | null>(null);
    const [customers, setCustomers] = useState<Location[]>([]);
    const [results, setResults] = useState<RoutingResults | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    useEffect(() => {
        // Initialize map with sample locations
        setDepotLocation(sampleLocations[0]);
        setCustomers(sampleLocations.slice(1));
    }, []);

    const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ext = file.name.split('.').pop();
        setUploadStatus('Đang xử lý tệp...');
        const applyData = (data: any) => {
            if (data.depot) setDepotLocation(data.depot);
            if (data.customers) setCustomers(data.customers);
            setUploadStatus('Tải lên thành công');
        };

        switch (ext) {
            case 'json':
                handleJSONUpload(file, applyData);
                break;
            case 'csv':
                handleCSVUpload(file, applyData);
                break;
            case 'geojson':
                handleGeoJSONUpload(file, applyData);
                break;
            default:
                setUploadStatus('Định dạng tệp không được hỗ trợ');
        }
    };

    const onSampleLoad = () => {
        setDepotLocation(sampleLocations[0]);
        setCustomers(sampleLocations.slice(1));
        setUploadStatus('Dữ liệu mẫu đã được nạp');
    };

    const onCalculate = async () => {
        setIsCalculating(true);
        await new Promise((r) => setTimeout(r, 1000)); // Fake delay
        // In App.tsx, onCalculate function
        const sampleResults: RoutingResults = {
            totalDistance: 123.45,
            totalTime: 220,
            vehiclesUsed: vehicles.length,
            routes: [
                {
                    vehicleId: 1,
                    distance: 45.3,
                    time: 80,
                    load: 85,
                    route: [
                        depotLocation,
                        customers[0],
                        customers[1],
                        customers[2],
                        depotLocation
                    ]
                },
                {
                    vehicleId: 2,
                    distance: 78.15,
                    time: 140,
                    load: 60,
                    route: [
                        depotLocation,
                        customers[3],
                        customers[4],
                        depotLocation
                    ]
                }
            ],
            algorithmStats: {
                executionTime: 1.23,
                iterations: 50,
                bestSolution: 120,
                convergence: 0.9,
            },
        };
        setResults(sampleResults);
        setIsCalculating(false);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header userRole={userRole} setUserRole={setUserRole}/>
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole}/>
            <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
                {activeTab === 'routing' && (
                    <RoutingInterface
                        problemType={problemType}
                        setProblemType={setProblemType}
                        algorithm={algorithm}
                        setAlgorithm={setAlgorithm}
                        vehicles={vehicles}
                        setVehicles={setVehicles}
                        depotLocation={depotLocation}
                        customers={customers}
                        setCustomers={setCustomers}
                        isCalculating={isCalculating}
                        results={results}
                        onCalculate={onCalculate}
                        onUpload={onUpload}
                        uploadStatus={uploadStatus}
                        onSampleLoad={onSampleLoad}
                    />
                )}
                {activeTab === 'analysis' && userRole !== 'end-user' && <AnalysisPanel/>}
                {activeTab === 'admin' && userRole === 'admin' && <AdminPanel/>}
            </main>
            <Footer/>
        </div>
    );
}