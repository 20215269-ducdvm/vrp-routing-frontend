export interface Location {
    id: string | number;
    lat: number;
    lng: number;
    name: string;
    type?: string;
    demand?: number;
    timeWindow?: number[];
}

export interface Vehicle {
    id: number;
    capacity: number;
}

export interface RouteResult {
    vehicleId: number;
    route: (Location | null)[];
    distance: number;
    time: number;
    load: number;
}

export interface AlgorithmStats {
    executionTime: number;
    iterations: number;
    bestSolution: number;
    convergence: number;
}

export interface RoutingResults {
    totalDistance: number;
    totalTime: number;
    vehiclesUsed: number;
    routes: RouteResult[];
    algorithmStats: AlgorithmStats;
}

export interface SearchResult {
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