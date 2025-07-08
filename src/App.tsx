// import { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import Header from './components/Header';
// import Tabs from './components/Tabs';
// import Footer from './components/Footer';
// import RoutingInterface from './components/RoutingInterface';
// import AnalysisPanel from './components/AnalysisPanel';
// import AdminPanel from './components/AdminPanel';
// import { setLocations } from './redux/actions/routingActions';
// import { calculateRoutes, uploadFile } from './redux/services/routingService';
// import { defaultLocations } from './redux/constants/DefaultLocations';
//
// import { RootState } from './redux/store';
// import { Location } from './redux/types/location';
// import { Vehicle } from './redux/types/vehicle';
//
// export default function App() {
//     const dispatch = useDispatch();
//
//     // Get state from Redux store
//     const {
//         activeTab,
//         userRole,
//         uploadStatus
//     } = useSelector((state: RootState) => state.ui);
//
//     const {
//         problemType,
//         algorithm,
//         vehicles,
//         locations,
//         results,
//         isCalculating
//     } = useSelector((state: RootState) => state.routing);
//
//     useEffect(() => {
//         // Initialize map with sample locations
//         dispatch(setLocations(defaultLocations));
//     }, [dispatch]);
//
//     const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             dispatch(uploadFile(file, locations) as any);
//         }
//     };
//
//     const onSampleLoad = () => {
//         dispatch(setLocations(defaultLocations));
//     };
//
//     const onCalculate = async () => {
//         // First, validate that all locations have valid coordinates
//         const hasInvalidLocations = locations.some(
//             (location: {
//                 lat: any;
//                 lon: any;
//             }) => !location || typeof location.lat !== 'number' || typeof location.lon !== 'number'
//         );
//
//         if (hasInvalidLocations) {
//             alert('Some locations have invalid coordinates. Please check your data.');
//             return;
//         }
//
//         // Get depot (first location) and customers (remaining locations)
//         const depot = locations[0];
//         const customers = locations.slice(1);
//
//         // Prepare request data
//         const requestData = {
//             problemType,
//             algorithm,
//             vehicles,
//             depot,
//             customers,
//         };
//
//         // Call the Redux action to calculate routes
//         dispatch(calculateRoutes(requestData) as any);
//     };
//
//     return (
//         <div className="min-h-screen flex flex-col">
//             <Header userRole={userRole} setUserRole={function (role: string): void {
//                 throw new Error('Function not implemented.');
//             }}/>
//             <Tabs activeTab={activeTab} setActiveTab={function (tab: string): void {
//                 throw new Error('Function not implemented.');
//             }} userRole={''}/>
//             <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
//                 {activeTab === 'routing' && (
//                     <RoutingInterface
//                         problemType={problemType}
//                         algorithm={algorithm}
//                         vehicles={vehicles}
//                         locations={locations}
//                         isCalculating={isCalculating}
//                         results={results?.solution || null}
//                         onCalculate={onCalculate}
//                         onUpload={onUpload}
//                         uploadStatus={uploadStatus}
//                         onSampleLoad={onSampleLoad}
//                         setLocations={setLocations}
//                         setProblemType={function (val: string): void {
//                         throw new Error('Function not implemented.');
//                     }} setAlgorithm={function (val: string): void {
//                         throw new Error('Function not implemented.');
//                     }} setVehicles={function (v: Vehicle[]): void {
//                         throw new Error('Function not implemented.');
//                     }}                    />
//                 )}
//                 {activeTab === 'analysis' && userRole !== 'end-user' &&
//                     <AnalysisPanel problemType={''} setProblemType={function(type: string): void {
//                     throw new Error('Function not implemented.');
//                 } } algorithm={''} setAlgorithm={function(alg: string): void {
//                     throw new Error('Function not implemented.');
//                 } } vehicles={[]} setVehicles={function(vehicles: { id: number; capacity: number; maxTime?: number | undefined; }[]): void {
//                     throw new Error('Function not implemented.');
//                 } } />
//                 }
//                 {activeTab === 'admin' && userRole === 'admin' &&
//                     <AdminPanel />
//                 }
//             </main>
//             <Footer />
//         </div>
//     );
// }
import {useEffect, useState} from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Footer from './components/Footer';
import RoutingInterface from './components/RoutingInterface';
import AnalysisPanel from './components/AnalysisPanel';
import AdminPanel from './components/AdminPanel';
import {handleCSVUpload, handleGeoJSONUpload, handleJSONUpload} from './services/fileHandlers';
import {solveRoutes} from './services/solveVRP';
import {Location} from "./redux/types/location";
import {VrpSolveResponse} from "./redux/types/vrpSolveResponse";
import {defaultLocations} from "./redux/constants/DefaultLocations";
import {defaultVehicles} from "./redux/constants/DefaultVehicles";

export default function App() {
    const [activeTab, setActiveTab] = useState('routing');
    const [userRole, setUserRole] = useState('end-user');

    const [problemType, setProblemType] = useState('CVRP');
    const [algorithm, setAlgorithm] = useState('harmony-search');
    const [vehicles, setVehicles] = useState(defaultVehicles);
    const [locations, setLocations] = useState<Location[]>([]);
    const [results, setResults] = useState<VrpSolveResponse | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    useEffect(() => {
        // Initialize map with sample locations
        setLocations(defaultLocations);
    }, []);

    const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ext = file.name.split('.').pop();
        setUploadStatus('Đang xử lý tệp...');

        const applyData = (data: any) => {
            // Create a new locations array with depot and customers
            const newLocations: Location[] = [];

            // Add depot if available
            if (data.depot) {
                newLocations.push({...data.depot, type: 'depot'});
            } else if (locations.length > 0 && locations[0].type === 'depot') {
                // Keep existing depot if new data doesn't have one
                newLocations.push(locations[0]);
            }

            // Add customers
            if (data.customers) {
                data.customers.forEach((customer: Location) => {
                    newLocations.push({...customer, type: 'customer'});
                });
            }

            setLocations(newLocations);
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
        setLocations(defaultLocations);
        setUploadStatus('Dữ liệu mẫu đã được nạp');
    };

    const onCalculate = async () => {
        setIsCalculating(true);

        // First, validate that all locations have valid coordinates
        const hasInvalidLocations = locations.some(
            location => !location || typeof location.lat !== 'number' || typeof location.lon !== 'number'
        );

        if (hasInvalidLocations) {
            alert('Some locations have invalid coordinates. Please check your data.');
            setIsCalculating(false);
            return;
        }

        try {
            // Get depot (first location) and customers (remaining locations)
            const depot = locations[0];
            const customers = locations.slice(1);

            // Prepare request data
            const requestData = {
                problemType,
                algorithm,
                vehicles,
                depot,
                customers,
            };
            // Call the API using the solveRoutes function
            const results = await solveRoutes(requestData);
            console.log('Results:', results);
            setResults(results);
        } catch (error) {
            console.error('Error calculating routes:', error);
            alert('Error calculating routes. Please try again later.');
        } finally {
            setIsCalculating(false);
        }
    };

    // Helper functions for RoutingInterface to work with the combined locations state
    const getDepot = () => locations[0];

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
                        locations={locations}
                        setLocations={setLocations}
                        isCalculating={isCalculating}
                        results={results?.solution || null}
                        onCalculate={onCalculate}
                        onUpload={onUpload}
                        uploadStatus={uploadStatus}
                        onSampleLoad={onSampleLoad}
                    />
                )}
                {activeTab === 'analysis' && userRole !== 'end-user' &&
                    <AnalysisPanel
                        problemType={problemType}
                        setProblemType={setProblemType}
                        algorithm={algorithm}
                        setAlgorithm={setAlgorithm}
                        vehicles={vehicles}
                        setVehicles={setVehicles}
                    />}
                {activeTab === 'admin' && userRole === 'admin' && <AdminPanel/>}
            </main>
            <Footer/>
        </div>
    );
}