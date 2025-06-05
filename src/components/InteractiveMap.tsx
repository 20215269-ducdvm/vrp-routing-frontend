import React, {useCallback, useEffect, useRef, useState} from 'react';
import debounce from 'lodash.debounce';
import {Edit3, MapPin, Navigation, Search, Trash2} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

declare global {
    interface Window {
        L: any;
    }
}

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
    importance: number;
    boundingbox?: string[];
    icon?: string;
    class: string;
    type: string;
}

interface InteractiveMapProps {
    depotLocation: Location | null;
    customers: Location[];
    setDepotLocation?: (loc: Location) => void;
    setCustomers?: (locs: Location[]) => void;
    problemType: string;
    routes?: Location[][];
    results?: any;
    editingLocation?: Location | null;
    selectedLocation?: Location | null;
    setEditingLocation?: (loc: Location | null) => void;
    setSelectedLocation?: (loc: Location | null) => void;
    mapCenter?: { lat: number; lng: number };
    mapZoom?: number;
    setMapCenter?: (center: { lat: number; lng: number }) => void;
    setMapZoom?: (zoom: number) => void;
}

const InteractiveMap = ({
                            depotLocation,
                            customers,
                            setDepotLocation,
                            setCustomers,
                            problemType,
                            routes,
                            results,
                            editingLocation,
                            selectedLocation,
                            setEditingLocation,
                            setSelectedLocation,
                            mapCenter = {lat: 21.0285, lng: 105.8542},
                            mapZoom = 13,
                            setMapCenter,
                            setMapZoom
                        }: InteractiveMapProps) => {
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

    // Update the handleMapClick function to correctly add locations
    const handleMapClick = (lat: number, lng: number) => {
        if (editingLocation) {
            // Update existing location
            const updatedLocation = {...editingLocation, lat, lng};

            if (editingLocation.type === 'depot') {
                setDepotLocation?.(updatedLocation);
            } else {
                setCustomers?.(customers.map((c) => (c.id === editingLocation.id ? updatedLocation : c)));
            }
            setEditingLocation?.(null);
        } else {
            // Calculate a proper next ID by finding the maximum existing ID and adding 1
            const newId = Math.max(0, ...customers.map(c =>
                typeof c.id === 'number' ? c.id : parseInt(c.id.toString()) || 0
            )) + 1;

            // Create a new customer with the calculated ID
            const newCustomer: Location = {
                id: newId,
                lat,
                lng,
                name: `Khách hàng ${newId}`,
                demand: Math.floor(Math.random() * 30) + 10,
                timeWindow: [8 + Math.floor(Math.random() * 6), 12 + Math.floor(Math.random() * 6)],
            };

            // Add the customer to the state - this will automatically update the table
            if (setCustomers) {
                // Create a completely new array to ensure React detects the change
                setCustomers([...customers, newCustomer]);

                // Select the newly added customer to provide visual feedback
                setSelectedLocation?.(newCustomer);

                console.log(`Added new customer with ID ${newId}`);
            }
        }
    };

// Fix the handleSelectLocation function to properly add customers

    const handleSelectLocation = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // Pan map to the selected location
        if (leafletMapRef.current) {
            leafletMapRef.current.setView([lat, lng], 16);
            setMapCenter?.({lat, lng});

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

            // Extract a better name from the result
            const locationName = result.name ||
                result.display_name.split(',')[0] ||
                `Địa điểm ${customers.length + 1}`;

            // Generate a unique button ID to avoid conflicts
            const btnId = `add-customer-btn-${Date.now()}`;

            // Show a popup with information and action buttons
            tempMarker.bindPopup(`
          <div class="p-2">
            <h4 class="font-semibold">${result.display_name}</h4>
            <p class="text-xs text-gray-600 mb-2">Tọa độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
            <div class="text-center">
              <button id="${btnId}" class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600">
                Thêm khách hàng mới
              </button>
            </div>
          </div>
        `, {closeButton: true}).openPopup();

            // Add event listener to the Add Customer button in the popup
            setTimeout(() => {
                const addBtn = document.getElementById(btnId);
                if (addBtn) {
                    addBtn.onclick = function (e) {
                        e.preventDefault();

                        // Calculate next ID properly using the same logic as handleMapClick
                        const newId = Math.max(0, ...customers.map(c =>
                            typeof c.id === 'number' ? c.id : parseInt(c.id.toString()) || 0
                        )) + 1;

                        // Create a new customer with the name from the search result if available
                        const newCustomer: Location = {
                            id: newId,
                            lat,
                            lng,
                            name: locationName ? `${locationName}` : `Khách hàng ${newId}`,
                            demand: Math.floor(Math.random() * 30) + 10,
                            timeWindow: [8 + Math.floor(Math.random() * 6), 12 + Math.floor(Math.random() * 6)],
                        };

                        // Important: Add the customer to the state directly
                        if (setCustomers) {
                            setCustomers([...customers, newCustomer]);

                            // Select the new customer
                            setSelectedLocation?.(newCustomer);

                            console.log(`Added new customer with ID ${newId} from search`);
                        }

                        // Close and remove the temporary marker
                        tempMarker.closePopup();
                        leafletMapRef.current.removeLayer(tempMarker);

                        // Provide visual feedback
                        const successToast = document.createElement('div');
                        successToast.className = 'bg-green-500 text-white px-4 py-2 rounded fixed bottom-4 right-4 z-50 shadow-lg';
                        successToast.textContent = `Đã thêm ${newCustomer.name} vào danh sách khách hàng!`;
                        document.body.appendChild(successToast);

                        // Remove the toast after 3 seconds
                        setTimeout(() => {
                            document.body.removeChild(successToast);
                        }, 3000);
                    };
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
                setSelectedLocation?.(depotLocation);
            });

            if (editingLocation?.id === depotLocation.id) {
                marker.on('dragend', (e: any) => {
                    const {lat, lng} = e.target.getLatLng();
                    const updatedLocation = {...depotLocation, lat, lng};
                    setDepotLocation?.(updatedLocation);
                    setEditingLocation?.(null);
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
                setSelectedLocation?.(customer);
            });

            if (editingLocation?.id === customer.id) {
                marker.on('dragend', (e: any) => {
                    const {lat, lng} = e.target.getLatLng();
                    const updatedCustomer = {...customer, lat, lng};
                    setCustomers?.(customers.map(c => c.id === customer.id ? updatedCustomer : c));
                    setEditingLocation?.(null);
                });
            }
        });

        // Draw routes if results exist
        if (results && results.routes) {
            results.routes.forEach((route: any, routeIndex: number) => {
                const routePoints = route.route.filter((point: any) => point !== null);
                if (routePoints.length < 2) return;

                const points = routePoints.map((point: any) => [point!.lat, point!.lng]);

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
    // Modify the polylineDecorator loading effect in InteractiveMap.tsx
    useEffect(() => {
        if (mapLoaded && window.L && !window.L.polylineDecorator) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet-polylinedecorator/dist/leaflet.polylineDecorator.js';
            script.onload = () => {
                console.log("Polyline decorator script loaded");
                // Force redraw routes when script is loaded
                if (results && results.routes) {
                    setTimeout(() => {
                        if (leafletMapRef.current) {
                            leafletMapRef.current.invalidateSize();
                        }
                    }, 100);
                }
            };
            document.head.appendChild(script);
        }
    }, [mapLoaded, results]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-2 items-center">
                <h3 className="text-lg font-semibold">Bản đồ tương tác</h3>

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
                        onClick={() => setMapZoom?.(Math.min(19, mapZoom + 1))}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                        + Zoom In
                    </button>
                    <button
                        onClick={() => setMapZoom?.(Math.max(10, mapZoom - 1))}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                        - Zoom Out
                    </button>
                    <button
                        onClick={() => {
                            if (depotLocation) {
                                setMapCenter?.({lat: depotLocation.lat, lng: depotLocation.lng});
                                setMapZoom?.(14);
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
                        📍 Đang chỉnh sửa "{editingLocation.name}" - Click trên bản đồ hoặc kéo thả marker để di chuyển
                        vị trí mới
                    </div>
                ) : (
                    <div className="space-y-1 text-blue-700 text-sm">
                        <div>• <strong>Tìm kiếm địa điểm</strong> bằng thanh tìm kiếm phía trên (hỗ trợ tiếng Việt có
                            dấu)
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
                                    setMapCenter?.({lat: selectedLocation.lat, lng: selectedLocation.lng});
                                    setMapZoom?.(15);
                                }}
                                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                title="Đến vị trí"
                            >
                                <Navigation size={16}/>
                            </button>
                            <button
                                onClick={() => setEditingLocation?.(selectedLocation)}
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
                                        setCustomers?.(customers.filter(c => c.id !== selectedLocation.id));
                                        setSelectedLocation?.(null);
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

export default InteractiveMap;