import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    BarChart3,
    Download,
    Edit3,
    MapPin,
    Navigation,
    Play,
    Search,
    Settings,
    Shield,
    Trash2,
    Truck,
    Upload,
    Users
} from 'lucide-react';
import debounce from 'lodash.debounce'; // You'll need to install this dependency

declare global {
    interface Window {
        L: any;
    }
}

const VRPRoutingApp = () => {
    const [activeTab, setActiveTab] = useState('routing');
    const [problemType, setProblemType] = useState('CVRP');
    const [algorithm, setAlgorithm] = useState('harmony-search');

    interface Location {
        id: string | number;
        lat: number;
        lng: number;
        name: string;
        type?: string;
        demand?: number;
        timeWindow?: number[];
    }

    interface SearchResult {
        place_id: number;
        name: string;
        display_name: string;
        lat: string;
        lon: string;
        boundingbox: string[];
        importance: number;
        icon?: string;
        class: string;
        type: string;
    }

    const [depotLocation, setDepotLocation] = useState<Location | null>(null);
    const [customers, setCustomers] = useState<Location[]>([]);
    const [vehicles, setVehicles] = useState([{id: 1, capacity: 100, maxTime: 480}]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [mapCenter, setMapCenter] = useState({lat: 21.0285, lng: 105.8542});
    const [mapZoom, setMapZoom] = useState(13);
    const [nextCustomerId, setNextCustomerId] = useState(6); // Track next available ID

    interface RouteResult {
        vehicleId: number;
        route: (Location | null)[];
        distance: number;
        time: number;
        load: number;
    }

    interface AlgorithmStats {
        executionTime: number;
        iterations: number;
        bestSolution: number;
        convergence: number;
    }

    interface RoutingResults {
        totalDistance: number;
        totalTime: number;
        vehiclesUsed: number;
        routes: RouteResult[];
        algorithmStats: AlgorithmStats;
    }

    const [results, setResults] = useState<RoutingResults | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [userRole, setUserRole] = useState('end-user');

    // Mock data for demonstration
    const algorithms = [
        {id: 'harmony-search', name: 'Harmony Search (Cải tiến)', type: 'meta-heuristic'},
        {id: 'guided-local-search', name: 'Guided Local Search', type: 'heuristic'},
        {id: 'genetic-algorithm', name: 'Genetic Algorithm', type: 'meta-heuristic'},
        {id: 'particle-swarm', name: 'Particle Swarm Optimization', type: 'meta-heuristic'},
        {id: 'clarke-wright', name: 'Clarke-Wright Savings', type: 'heuristic'}
    ];

    const sampleLocations = [
        {id: 'depot', lat: 21.0285, lng: 105.8542, name: 'Kho chính - HUST', type: 'depot'},
        {id: 1, lat: 21.0245, lng: 105.8412, name: 'Khách hàng 1 - Hoàn Kiếm', demand: 15, timeWindow: [8, 10]},
        {id: 2, lat: 21.0325, lng: 105.8372, name: 'Khách hàng 2 - Ba Đình', demand: 25, timeWindow: [9, 11]},
        {id: 3, lat: 21.0185, lng: 105.8502, name: 'Khách hàng 3 - Hai Bà Trưng', demand: 20, timeWindow: [10, 12]},
        {id: 4, lat: 21.0365, lng: 105.8602, name: 'Khách hàng 4 - Đống Đa', demand: 30, timeWindow: [11, 13]},
        {id: 5, lat: 21.0205, lng: 105.8282, name: 'Khách hàng 5 - Tây Hồ', demand: 18, timeWindow: [13, 15]}
    ];

    useEffect(() => {
        initializeMap();
    }, []);

    const initializeMap = () => {
        setDepotLocation(sampleLocations[0]);
        setCustomers(sampleLocations.slice(1));
    };

    // File upload handlers (keep existing implementations)
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadStatus('Đang xử lý file...');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;

                if (file.name.endsWith('.json')) {
                    handleJSONUpload(content);
                } else if (file.name.endsWith('.csv')) {
                    handleCSVUpload(content);
                } else if (file.name.endsWith('.geojson')) {
                    handleGeoJSONUpload(content);
                } else {
                    setUploadStatus('Định dạng file không được hỗ trợ. Vui lòng chọn file CSV, JSON hoặc GeoJSON.');
                    setTimeout(() => setUploadStatus(''), 3000);
                    return;
                }

                setUploadStatus('File đã được tải lên thành công!');
                setTimeout(() => setUploadStatus(''), 3000);
            } catch (error) {
                setUploadStatus('Lỗi khi xử lý file. Vui lòng kiểm tra định dạng file.');
                setTimeout(() => setUploadStatus(''), 3000);
            }
        };

        reader.readAsText(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleJSONUpload = (content: string) => {
        const data = JSON.parse(content);

        if (data.depot) {
            setDepotLocation(data.depot);
            setMapCenter({lat: data.depot.lat, lng: data.depot.lng});
        }

        if (data.customers && Array.isArray(data.customers)) {
            setCustomers(data.customers.map((customer: any, index: number) => ({
                id: customer.id || index + 1,
                lat: customer.lat || customer.latitude,
                lng: customer.lng || customer.longitude,
                name: customer.name || `Khách hàng ${index + 1}`,
                demand: customer.demand || Math.floor(Math.random() * 30) + 10,
                timeWindow: customer.timeWindow || [8, 17]
            })));
        }

        if (data.vehicles && Array.isArray(data.vehicles)) {
            setVehicles(data.vehicles);
        }
    };

    const handleCSVUpload = (content: string) => {
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const customers: Location[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const customer: any = {};

            headers.forEach((header, index) => {
                const value = values[index];

                switch (header) {
                    case 'id':
                        customer.id = value;
                        break;
                    case 'name':
                    case 'tên':
                        customer.name = value;
                        break;
                    case 'lat':
                    case 'latitude':
                    case 'vĩ độ':
                        customer.lat = parseFloat(value);
                        break;
                    case 'lng':
                    case 'lon':
                    case 'longitude':
                    case 'kinh độ':
                        customer.lng = parseFloat(value);
                        break;
                    case 'demand':
                    case 'nhu cầu':
                        customer.demand = parseInt(value);
                        break;
                    case 'timewindow_start':
                    case 'giờ bắt đầu':
                        customer.timeWindowStart = parseInt(value);
                        break;
                    case 'timewindow_end':
                    case 'giờ kết thúc':
                        customer.timeWindowEnd = parseInt(value);
                        break;
                }
            });

            if (customer.lat && customer.lng) {
                customer.name = customer.name || `Khách hàng ${i}`;
                customer.demand = customer.demand || Math.floor(Math.random() * 30) + 10;
                if (customer.timeWindowStart && customer.timeWindowEnd) {
                    customer.timeWindow = [customer.timeWindowStart, customer.timeWindowEnd];
                }
                customers.push(customer);
            }
        }

        setCustomers(customers);
    };

    const handleGeoJSONUpload = (content: string) => {
        const geojson = JSON.parse(content);

        if (geojson.type === 'FeatureCollection' && geojson.features) {
            const customers: Location[] = [];

            geojson.features.forEach((feature: any, index: number) => {
                if (feature.geometry && feature.geometry.type === 'Point') {
                    const [lng, lat] = feature.geometry.coordinates;
                    const properties = feature.properties || {};

                    const customer: Location = {
                        id: properties.id || index + 1,
                        lat,
                        lng,
                        name: properties.name || `Khách hàng ${index + 1}`,
                        demand: properties.demand || Math.floor(Math.random() * 30) + 10,
                        timeWindow: properties.timeWindow || [8, 17]
                    };

                    if (properties.type === 'depot') {
                        setDepotLocation(customer);
                    } else {
                        customers.push(customer);
                    }
                }
            });

            setCustomers(customers);
        }
    };

    // Map interaction handlers
    const handleMapClick = (lat: number, lng: number) => {
        if (editingLocation) {
            // Update existing location
            const updatedLocation = {...editingLocation, lat, lng};

            if (editingLocation.type === 'depot') {
                setDepotLocation(updatedLocation);
            } else {
                setCustomers(customers.map(c =>
                    c.id === editingLocation.id ? updatedLocation : c
                ));
            }
            setEditingLocation(null);
        } else {
            // Add new customer with unique ID
            const newCustomer = {
                id: nextCustomerId,
                lat,
                lng,
                name: `Khách hàng ${nextCustomerId}`,
                demand: Math.floor(Math.random() * 30) + 10,
                timeWindow: [8 + Math.floor(Math.random() * 6), 12 + Math.floor(Math.random() * 6)]
            };
            setCustomers([...customers, newCustomer]);
            setNextCustomerId(nextCustomerId + 1); // Increment for next customer
        }
    };

    const handleLocationEdit = (location: Location) => {
        setEditingLocation(location);
    };

    const handleLocationDelete = (locationId: string | number) => {
        setCustomers(customers.filter(c => c.id !== locationId));
        if (selectedLocation?.id === locationId) {
            setSelectedLocation(null);
        }
        // Don't update nextCustomerId - keep it incrementing
    };

    const updateMapCenter = (location: Location) => {
        setMapCenter({lat: location.lat, lng: location.lng});
        setMapZoom(15);
    };

    // Export functions (keep existing implementations)
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
          <p>Thuật toán: ${algorithms.find(a => a.id === algorithm)?.name}</p>
          <p>Loại bài toán: ${problemType}</p>
        </div>

        <div class="stats">
          <div class="stat-box">
            <h3>${results.totalDistance} km</h3>
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
            <p>Khoảng cách: ${route.distance} km | Thời gian: ${route.time} phút | Tải trọng: ${route.load}</p>
            <p>Lộ trình: ${route.route.map(point => point?.name || 'Unknown').join(' → ')}</p>
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

        if (depotLocation) {
            features.push({
                type: 'Feature',
                properties: {
                    type: 'depot',
                    name: depotLocation.name,
                    id: depotLocation.id
                },
                geometry: {
                    type: 'Point',
                    coordinates: [depotLocation.lng, depotLocation.lat]
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
                    coordinates: [customer.lng, customer.lat]
                }
            });
        });

        results.routes.forEach((route, index) => {
            const coordinates = route.route
                .filter(point => point !== null)
                .map(point => [point!.lng, point!.lat]);

            if (coordinates.length > 1) {
                features.push({
                    type: 'Feature',
                    properties: {
                        type: 'route',
                        vehicleId: route.vehicleId,
                        distance: route.distance,
                        time: route.time,
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
                problemType,
                algorithm,
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

    const calculateRoute = async () => {
        setIsCalculating(true);

        await new Promise(resolve => setTimeout(resolve, 3000));

        const mockResults = {
            totalDistance: 145.7,
            totalTime: 385,
            vehiclesUsed: 2,
            routes: [
                {
                    vehicleId: 1,
                    route: [depotLocation, customers[0], customers[2], customers[4], depotLocation],
                    distance: 72.3,
                    time: 185,
                    load: 53
                },
                {
                    vehicleId: 2,
                    route: [depotLocation, customers[1], customers[3], depotLocation],
                    distance: 73.4,
                    time: 200,
                    load: 55
                }
            ],
            algorithmStats: {
                executionTime: 2.84,
                iterations: 1500,
                bestSolution: 145.7,
                convergence: 95.2
            }
        };

        setResults(mockResults);
        setIsCalculating(false);
    };


    const InteractiveMapComponent = () => {
        const mapRef = useRef<HTMLDivElement>(null);
        const leafletMapRef = useRef<any>(null);
        const [mapLoaded, setMapLoaded] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
        const [isSearching, setIsSearching] = useState(false);
        const [showResults, setShowResults] = useState(false);

        // Debounce the search function to avoid making too many API calls
        const debouncedSearch = useCallback(
            debounce(async (query: string) => {
                if (!query || query.length < 2) { // Reduced minimum length to 2 for Vietnamese words
                    setSearchResults([]);
                    setIsSearching(false);
                    return;
                }

                setIsSearching(true);
                try {
                    // Configure Nominatim for Vietnamese language support
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?` +
                        `q=${encodeURIComponent(query)}` +
                        `&format=json` +
                        `&addressdetails=1` +
                        `&limit=8` + // Increased limit for better coverage of Vietnamese results
                        `&viewbox=105.5,21.4,106.2,20.7` + // Hanoi bounding box
                        `&bounded=1` +
                        `&accept-language=vi` + // Set preferred language to Vietnamese
                        `&countrycodes=vn` // Limit to Vietnam results
                    );
                    const data = await response.json();

                    // Sort results by relevance and location
                    // Vietnamese places first, then by importance
                    const sortedResults = data.sort((a: SearchResult, b: SearchResult) => {
                        // Prioritize results with Vietnamese names
                        const aHasVietnamese = hasVietnameseChars(a.display_name);
                        const bHasVietnamese = hasVietnameseChars(b.display_name);

                        if (aHasVietnamese && !bHasVietnamese) return -1;
                        if (!aHasVietnamese && bHasVietnamese) return 1;

                        // Then sort by importance (nominatim's relevance score)
                        return b.importance - a.importance;
                    });

                    setSearchResults(sortedResults);
                } catch (error) {
                    console.error("Error searching locations:", error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 400), // Reduced debounce time for better responsiveness
            []
        );

        // Helper function to detect Vietnamese characters
        const hasVietnameseChars = (text: string): boolean => {
            // Basic check for Vietnamese diacritical marks and characters
            const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
            return vietnamesePattern.test(text);
        };

        // Handle search input changes
        const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const query = e.target.value;
            setSearchQuery(query);
            setShowResults(true);
            debouncedSearch(query);
        };

        // Handle selecting a search result
        const handleSelectLocation = (result: SearchResult) => {
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);

            // Pan map to the selected location
            if (leafletMapRef.current) {
                leafletMapRef.current.setView([lat, lng], 16);
                setMapCenter({lat, lng});

                // Create a temporary marker to show the selected location
                const tempMarker = window.L.marker([lat, lng], {
                    icon: window.L.divIcon({
                        className: 'search-result-marker',
                        html: `<div class="bg-yellow-500 text-white p-2 rounded-full shadow-lg pulse-animation">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>`,
                        iconSize: [30, 30] as [number, number],
                        iconAnchor: [15, 15] as [number, number],
                    })
                }).addTo(leafletMapRef.current);

                // Show a popup with information and action buttons
                tempMarker.bindPopup(`
        <div class="p-2">
          <h4 class="font-semibold">${result.display_name}</h4>
          <p class="text-xs text-gray-600 mb-2">Tọa độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
          <div class="text-center">
            <button id="add-customer-btn" class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600">
              Thêm khách hàng mới
            </button>
          </div>
        </div>
      `, {closeButton: true}).openPopup();

                // Add event listener to the Add Customer button in the popup
                setTimeout(() => {
                    const addBtn = document.getElementById('add-customer-btn');
                    if (addBtn) {
                        addBtn.addEventListener('click', () => {
                            handleMapClick(lat, lng);
                            tempMarker.closePopup();
                            leafletMapRef.current.removeLayer(tempMarker);
                        });
                    }
                }, 100);

                // Remove the marker after a timeout or when popup is closed
                tempMarker.on('popupclose', () => {
                    leafletMapRef.current.removeLayer(tempMarker);
                });
            }

            // Clear search
            setSearchQuery('');
            setSearchResults([]);
            setShowResults(false);
        };

        // Initialize Leaflet map
        useEffect(() => {
            // Load Leaflet CSS from CDN
            if (!document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                link.crossOrigin = '';
                document.head.appendChild(link);
            }

            // Load Leaflet JS from CDN
            const loadLeaflet = () => {
                return new Promise<void>((resolve) => {
                    if (window.L) {
                        resolve();
                        return;
                    }

                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
                    script.crossOrigin = '';
                    script.onload = () => resolve();
                    document.head.appendChild(script);
                });
            };

            const initMap = async () => {
                await loadLeaflet();

                if (mapRef.current && !leafletMapRef.current) {
                    // Initialize map with Hanoi center
                    const map = window.L.map(mapRef.current).setView([mapCenter.lat, mapCenter.lng], mapZoom);

                    // Add OpenStreetMap tiles
                    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 19
                    }).addTo(map);

                    // Add zoom controls
                    window.L.control.zoom({
                        position: 'topright'
                    }).addTo(map);

                    // Handle map click
                    map.on('click', (e: any) => {
                        const {lat, lng} = e.latlng;
                        handleMapClick(lat, lng);
                    });

                    // Store map reference
                    leafletMapRef.current = map;
                    setMapLoaded(true);
                }
            };

            initMap();

            // Cleanup
            return () => {
                if (leafletMapRef.current) {
                    leafletMapRef.current.remove();
                    leafletMapRef.current = null;
                }
            };
        }, []);

        // Add CSS for the search results dropdown and pulse animation
        useEffect(() => {
            // Add CSS for pulse animation
            const style = document.createElement('style');
            style.innerHTML = `
      .pulse-animation {
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
        }

        70% {
          box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
        }

        100% {
          box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
        }
      }
    `;
            document.head.appendChild(style);

            return () => {
                document.head.removeChild(style);
            };
        }, []);

        // Close search results when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as HTMLElement;
                if (!target.closest('.search-container')) {
                    setShowResults(false);
                }
            };

            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }, []);

        // Update markers and routes when data changes
        useEffect(() => {
            if (!mapLoaded || !leafletMapRef.current || !window.L) return;

            const map = leafletMapRef.current;

            // Clear all existing markers and routes
            map.eachLayer((layer: any) => {
                if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline) {
                    map.removeLayer(layer);
                }
            });

            // Re-add the base tile layer if it was removed
            if (!map.hasLayer(window.L.tileLayer)) {
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19
                }).addTo(map);
            }

            // Create custom depot icon
            const depotIcon = window.L.divIcon({
                className: 'custom-depot-icon',
                html: `<div class="bg-red-500 text-white p-3 rounded-full shadow-xl flex items-center justify-center ${
                    editingLocation?.id === depotLocation?.id ? 'ring-4 ring-yellow-400 animate-pulse' : ''
                } ${
                    selectedLocation?.id === depotLocation?.id ? 'ring-2 ring-red-300' : ''
                }">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
      </div>`,
                iconSize: [40, 40] as [number, number],
                iconAnchor: [20, 20] as [number, number],
            });

            // Add depot marker
            if (depotLocation) {
                const marker = window.L.marker([depotLocation.lat, depotLocation.lng], {
                    icon: depotIcon,
                    draggable: editingLocation?.id === depotLocation.id
                })
                    .addTo(map)
                    .bindPopup(`
          <div class="p-1">
            <h4 class="font-semibold text-lg">🏭 ${depotLocation.name}</h4>
            <p><strong>ID:</strong> ${depotLocation.id}</p>
            <p><strong>Tọa độ:</strong> ${depotLocation.lat.toFixed(4)}, ${depotLocation.lng.toFixed(4)}</p>
          </div>
        `);

                marker.on('click', () => {
                    setSelectedLocation(depotLocation);
                });

                if (editingLocation?.id === depotLocation.id) {
                    marker.on('dragend', (e: any) => {
                        const {lat, lng} = e.target.getLatLng();
                        const updatedLocation = {...depotLocation, lat, lng};
                        setDepotLocation(updatedLocation);
                        setEditingLocation(null);
                    });
                }
            }

            // Create and add customer markers
            customers.forEach(customer => {
                // Create custom number marker
                const customerIcon = window.L.divIcon({
                    className: 'custom-customer-icon',
                    html: `<div class="bg-blue-500 text-white p-2 rounded-full shadow-lg flex items-center justify-center ${
                        editingLocation?.id === customer.id ? 'ring-4 ring-yellow-400 animate-pulse' : ''
                    } ${
                        selectedLocation?.id === customer.id ? 'ring-2 ring-blue-300' : ''
                    }">
          <div class="text-xs font-bold min-w-[16px] text-center">${customer.id}</div>
        </div>`,
                    iconSize: [30, 30] as [number, number],
                    iconAnchor: [15, 15] as [number, number],
                });

                const marker = window.L.marker([customer.lat, customer.lng], {
                    icon: customerIcon,
                    draggable: editingLocation?.id === customer.id
                })
                    .addTo(map)
                    .bindPopup(`
          <div class="p-1">
            <h4 class="font-semibold">👤 ${customer.name}</h4>
            <p><strong>ID:</strong> ${customer.id}</p>
            <p><strong>Nhu cầu:</strong> ${customer.demand} đơn vị</p>
            ${customer.timeWindow ?
                        `<p><strong>Khung giờ:</strong> ${customer.timeWindow[0]}:00 - ${customer.timeWindow[1]}:00</p>` :
                        ''}
            <p><strong>Tọa độ:</strong> ${customer.lat.toFixed(4)}, ${customer.lng.toFixed(4)}</p>
          </div>
        `);

                marker.on('click', () => {
                    setSelectedLocation(customer);
                });

                if (editingLocation?.id === customer.id) {
                    marker.on('dragend', (e: any) => {
                        const {lat, lng} = e.target.getLatLng();
                        const updatedCustomer = {...customer, lat, lng};
                        setCustomers(customers.map(c => c.id === customer.id ? updatedCustomer : c));
                        setEditingLocation(null);
                    });
                }
            });

            // Draw routes if results exist
            if (results) {
                results.routes.forEach((route, routeIndex) => {
                    const routePoints = route.route.filter(point => point !== null);
                    if (routePoints.length < 2) return;

                    const points = routePoints.map(point => [point!.lat, point!.lng]);

                    const polyline = window.L.polyline(points as [number, number][], {
                        color: routeIndex === 0 ? '#ef4444' : '#3b82f6',
                        weight: 4,
                        opacity: 0.8,
                        dashArray: routeIndex === 0 ? undefined : "8,4"
                    }).addTo(map);

                    // Add popup with route details
                    polyline.bindPopup(`
          <div class="p-1">
            <h4 class="font-semibold">Lộ trình xe ${route.vehicleId}</h4>
            <p><strong>Khoảng cách:</strong> ${route.distance} km</p>
            <p><strong>Thời gian:</strong> ${route.time} phút</p>
            <p><strong>Tải trọng:</strong> ${route.load}</p>
          </div>
        `);

                    // Try to add decorator if the function exists
                    try {
                        if (window.L.polylineDecorator) {
                            const decorator = window.L.polylineDecorator(polyline, {
                                patterns: [
                                    {
                                        offset: '5%',
                                        repeat: '10%',
                                        symbol: window.L.Symbol.arrowHead({
                                            pixelSize: 10,
                                            pathOptions: {
                                                color: routeIndex === 0 ? '#ef4444' : '#3b82f6',
                                                fillOpacity: 1,
                                                weight: 0
                                            }
                                        })
                                    }
                                ]
                            });

                            decorator.addTo(map);
                        }
                    } catch (e) {
                        console.warn('PolylineDecorator plugin not fully loaded yet');
                    }
                });
            }
        }, [depotLocation, customers, results, mapLoaded, editingLocation, selectedLocation]);

        // Update map center and zoom when they change
        useEffect(() => {
            if (mapLoaded && leafletMapRef.current) {
                leafletMapRef.current.setView([mapCenter.lat, mapCenter.lng], mapZoom);
            }
        }, [mapCenter, mapZoom, mapLoaded]);

        // Load L.polylineDecorator for the arrows
        useEffect(() => {
            if (mapLoaded && window.L && !window.L.polylineDecorator) {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet-polylinedecorator/dist/leaflet.polylineDecorator.js';
                document.head.appendChild(script);
            }
        }, [mapLoaded]);

        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2 items-center">
                    <h3 className="text-lg font-semibold">Bản đồ tương tác - Hà Nội</h3>

                    {/* Search bar with Vietnamese support */}
                    <div className="w-full sm:w-64 md:w-96 relative search-container">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm địa điểm (có thể nhập tiếng Việt)..."
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                                onClick={() => searchQuery.length >= 2 && setShowResults(true)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                <Search size={18}/>
                            </div>
                            {isSearching && (
                                <div className="absolute right-3 top-2.5">
                                    <div
                                        className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                </div>
                            )}
                        </div>

                        {/* Search results dropdown with Vietnamese support */}
                        {showResults && (searchResults.length > 0 || isSearching) && (
                            <div
                                className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {isSearching && searchResults.length === 0 && (
                                    <div className="p-3 text-gray-500 text-sm text-center">Đang tìm kiếm...</div>
                                )}

                                {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                                    <div className="p-3 text-gray-500 text-sm text-center">
                                        Không tìm thấy kết quả cho "{searchQuery}"
                                    </div>
                                )}

                                {searchResults.map((result) => (
                                    <div
                                        key={result.place_id}
                                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 flex items-start"
                                        onClick={() => handleSelectLocation(result)}
                                    >
                                        <div className="text-blue-500 mr-2 mt-1">
                                            <MapPin size={16}/>
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">
                                                {result.name || result.display_name.split(',')[0]}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {result.display_name}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setMapZoom(Math.min(19, mapZoom + 1))}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                            + Zoom In
                        </button>
                        <button
                            onClick={() => setMapZoom(Math.max(10, mapZoom - 1))}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                            - Zoom Out
                        </button>
                        <button
                            onClick={() => {
                                if (depotLocation) {
                                    setMapCenter({lat: depotLocation.lat, lng: depotLocation.lng});
                                    setMapZoom(14);
                                }
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                            🏠 Về kho
                        </button>
                    </div>
                </div>

                {/* Map container */}
                <div
                    ref={mapRef}
                    className="h-96 border-2 border-gray-300 rounded-lg relative overflow-hidden cursor-pointer"
                >
                    {/* Loading state */}
                    {!mapLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <div
                                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-gray-600">Đang tải bản đồ OpenStreetMap...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Map instructions with Vietnamese support */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">📋 Hướng dẫn sử dụng bản đồ:</h4>
                    {editingLocation ? (
                        <div className="text-orange-700 font-medium">
                            📍 Đang chỉnh sửa "{editingLocation.name}" - Click trên bản đồ hoặc kéo thả marker để di
                            chuyển vị trí mới
                        </div>
                    ) : (
                        <div className="space-y-1 text-blue-700 text-sm">
                            <div>• <strong>Tìm kiếm địa điểm</strong> bằng thanh tìm kiếm phía trên (hỗ trợ tiếng Việt
                                có dấu)
                            </div>
                            <div>• <strong>Click trên bản đồ</strong> để thêm khách hàng mới (ID tự động tăng)</div>
                            <div>• <strong>Click vào marker</strong> để xem chi tiết và thao tác</div>
                            <div>• <strong>Marker đỏ 🏭 = Kho</strong>, <strong>Marker xanh 👤 = Khách hàng</strong></div>
                            <div>• Di chuyển bản đồ bằng cách kéo thả, phóng to/thu nhỏ bằng chuột hoặc nút zoom</div>
                            <div>• Sử dụng nút "🏠 Về kho" để quay lại vị trí kho chính</div>
                        </div>
                    )}
                </div>

                {/* Location details panel */}
                {selectedLocation && (
                    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-md">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="font-semibold text-lg flex items-center">
                                    {selectedLocation.type === 'depot' ? '🏭' : '👤'} {selectedLocation.name}
                                </h4>
                                <div className="mt-1 space-y-1 text-sm text-gray-600">
                                    <p><strong>ID:</strong> {selectedLocation.id}</p>
                                    <p><strong>Tọa
                                        độ:</strong> {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                                    </p>
                                    {selectedLocation.type !== 'depot' && (
                                        <>
                                            <p><strong>Nhu cầu:</strong> {selectedLocation.demand} đơn vị</p>
                                            {selectedLocation.timeWindow && (
                                                <p><strong>Khung giờ:</strong> {selectedLocation.timeWindow[0]}:00
                                                    - {selectedLocation.timeWindow[1]}:00</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <button
                                    onClick={() => {
                                        setMapCenter({lat: selectedLocation.lat, lng: selectedLocation.lng});
                                        setMapZoom(15);
                                    }}
                                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    title="Đến vị trí"
                                >
                                    <Navigation size={16}/>
                                </button>
                                <button
                                    onClick={() => handleLocationEdit(selectedLocation)}
                                    className={`p-2 text-white rounded transition-colors ${
                                        editingLocation?.id === selectedLocation.id
                                            ? 'bg-orange-500 hover:bg-orange-600'
                                            : 'bg-green-500 hover:bg-green-600'
                                    }`}
                                    title={editingLocation?.id === selectedLocation.id ? 'Đang chỉnh sửa...' : 'Chỉnh sửa vị trí'}
                                >
                                    <Edit3 size={16}/>
                                </button>
                                {selectedLocation.type !== 'depot' && (
                                    <button
                                        onClick={() => {
                                            handleLocationDelete(selectedLocation.id);
                                            setSelectedLocation(null);
                                        }}
                                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        title="Xóa khách hàng"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const RoutingInterface = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Settings className="mr-2" size={20}/>
                            Cấu hình bài toán
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Loại bài toán</label>
                                <select
                                    value={problemType}
                                    onChange={(e) => setProblemType(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="CVRP">CVRP (Ràng buộc trọng tải)</option>
                                    <option value="VRPTW">VRPTW (Ràng buộc thời gian)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Thuật toán</label>
                                <select
                                    value={algorithm}
                                    onChange={(e) => setAlgorithm(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    {algorithms.map(alg => (
                                        <option key={alg.id} value={alg.id}>
                                            {alg.name} ({alg.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Số xe</label>
                                    <input
                                        type="number"
                                        value={vehicles.length}
                                        onChange={(e) => {
                                            const count = parseInt(e.target.value);
                                            setVehicles(Array.from({length: count}, (_, i) => ({
                                                id: i + 1,
                                                capacity: 100,
                                                maxTime: 480
                                            })));
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        min="1"
                                        max="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Sức chứa xe</label>
                                    <input
                                        type="number"
                                        value={vehicles[0]?.capacity || 100}
                                        onChange={(e) => {
                                            const capacity = parseInt(e.target.value);
                                            setVehicles(vehicles.map(v => ({...v, capacity})));
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Upload className="mr-2" size={20}/>
                            Nhập dữ liệu
                        </h3>

                        <div className="space-y-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
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
                                onClick={() => {
                                    setDepotLocation(sampleLocations[0]);
                                    setCustomers(sampleLocations.slice(1));
                                    setMapCenter({lat: sampleLocations[0].lat, lng: sampleLocations[0].lng});
                                    setNextCustomerId(6); // Reset next ID after loading sample data
                                }}
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
                                                depot: depotLocation,
                                                customers,
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
                                            if (!customers.length) return;

                                            let csvContent = 'ID,Tên,Vĩ độ,Kinh độ,Nhu cầu';
                                            if (problemType === 'VRPTW') {
                                                csvContent += ',Giờ bắt đầu,Giờ kết thúc';
                                            }
                                            csvContent += '\n';

                                            customers.forEach(customer => {
                                                csvContent += `${customer.id},"${customer.name}",${customer.lat},${customer.lng},${customer.demand}`;
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
                </div>

                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <InteractiveMapComponent/>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Danh sách khách hàng ({customers.length} điểm)</h3>
                    <button
                        onClick={calculateRoute}
                        disabled={isCalculating || customers.length === 0}
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

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-2 text-left">ID</th>
                            <th className="border border-gray-300 p-2 text-left">Tên</th>
                            <th className="border border-gray-300 p-2 text-left">Tọa độ</th>
                            <th className="border border-gray-300 p-2 text-left">Nhu cầu</th>
                            {problemType === 'VRPTW' && (
                                <th className="border border-gray-300 p-2 text-left">Khung giờ</th>
                            )}
                            <th className="border border-gray-300 p-2 text-left">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {customers.map((customer, index) => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-2">{customer.id}</td>
                                <td className="border border-gray-300 p-2">{customer.name}</td>
                                <td className="border border-gray-300 p-2">{customer.lat.toFixed(4)}, {customer.lng.toFixed(4)}</td>
                                <td className="border border-gray-300 p-2">{customer.demand}</td>
                                {problemType === 'VRPTW' && (
                                    <td className="border border-gray-300 p-2">
                                        {customer.timeWindow ? `${customer.timeWindow[0]}:00 - ${customer.timeWindow[1]}:00` : 'N/A'}
                                    </td>
                                )}
                                <td className="border border-gray-300 p-2">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                // if (mapInstance) {
                                                //   mapInstance.setView([customer.lat, customer.lng], 15);
                                                // }
                                            }}
                                            className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                            title="Xem trên bản đồ"
                                        >
                                            <Navigation size={12}/>
                                        </button>
                                        <button
                                            onClick={() => handleLocationEdit(customer)}
                                            className="p-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit3 size={12}/>
                                        </button>
                                        <button
                                            onClick={() => handleLocationDelete(customer.id)}
                                            className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                            title="Xóa"
                                        >
                                            <Trash2 size={12}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {results && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <BarChart3 className="mr-2" size={20}/>
                        Kết quả định tuyến
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{results.totalDistance} km</div>
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
                                        {route.distance} km • {route.time} phút • Tải: {route.load}
                                    </div>
                                </div>
                                <div className="text-sm bg-gray-50 p-2 rounded">
                                    <span className="font-medium">Lộ trình: </span>
                                    {route.route.map((point, idx) => (
                                        <span key={idx}>
                      {point?.name || 'Unknown'}
                                            {idx < route.route.length - 1 && ' → '}
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

    const AnalysisInterface = () => (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">So sánh thuật toán</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-4">Tùy chỉnh thuật toán</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Harmony Search - HMCR</label>
                                <input type="range" min="0.1" max="1" step="0.1" className="w-full"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Genetic Algorithm - Population
                                    Size</label>
                                <input type="number" defaultValue="100"
                                       className="w-full p-2 border border-gray-300 rounded-md"/>
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
                                <div key={alg.id}
                                     className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">{alg.name}</span>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{(150 + index * 5).toFixed(1)} km</div>
                                        <div className="text-xs text-gray-600">{(2.5 + index * 0.3).toFixed(1)}s</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const AdminInterface = () => (
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
                        <tr>
                            <td className="border border-gray-300 p-2">001</td>
                            <td className="border border-gray-300 p-2">Nguyễn Văn A</td>
                            <td className="border border-gray-300 p-2">nguyenvana@company.com</td>
                            <td className="border border-gray-300 p-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    End User
                  </span>
                            </td>
                            <td className="border border-gray-300 p-2">2 giờ trước</td>
                            <td className="border border-gray-300 p-2">
                                <button className="text-blue-600 hover:underline text-sm">Chỉnh sửa</button>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-2">002</td>
                            <td className="border border-gray-300 p-2">Trần Thị B</td>
                            <td className="border border-gray-300 p-2">tranthib@company.com</td>
                            <td className="border border-gray-300 p-2">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    Analyst
                  </span>
                            </td>
                            <td className="border border-gray-300 p-2">1 ngày trước</td>
                            <td className="border border-gray-300 p-2">
                                <button className="text-blue-600 hover:underline text-sm">Chỉnh sửa</button>
                            </td>
                        </tr>
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
                            <input type="checkbox" defaultChecked className="rounded"/>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Upload Algorithm</span>
                            <input type="checkbox" className="rounded"/>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Compare Results</span>
                            <input type="checkbox" defaultChecked className="rounded"/>
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Truck className="h-8 w-8 text-blue-600 mr-3"/>
                            <h1 className="text-xl font-bold">VRP Routing Optimizer</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <select
                                value={userRole}
                                onChange={(e) => setUserRole(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                            >
                                <option value="end-user">Người dùng cuối</option>
                                <option value="analyst">Nhà phân tích</option>
                                <option value="admin">Quản trị viên</option>
                            </select>

                            <div className="flex items-center text-sm text-gray-600">
                                <Shield className="h-4 w-4 mr-1"/>
                                <span>Dư Vũ Mạnh Đức</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
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
                            <MapPin className="inline-block mr-2" size={16}/>
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
                                <BarChart3 className="inline-block mr-2" size={16}/>
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
                                <Users className="inline-block mr-2" size={16}/>
                                Quản trị
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'routing' && <RoutingInterface/>}
                {activeTab === 'analysis' && <AnalysisInterface/>}
                {activeTab === 'admin' && <AdminInterface/>}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            {/* © 2025 HUST - Đại học Bách khoa Hà Nội. Đồ án tốt nghiệp của Dư Vũ Mạnh Đức */}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {/* <span>Thuật toán: Harmony Search + Guided Local Search</span> */}
                            <span>•</span>
                            <span>Version: 1.0</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default VRPRoutingApp;