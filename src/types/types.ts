export interface Location {
    id: number;
    lat: number;
    lon: number;
    name: string;
    type: string;
    demand: number;
    timeWindow?: number[];
}

export interface Vehicle {
    id: number;
    capacity: number;
}

export interface RouteData {
    vehicleId: number;
    customers: (Location | null)[];
    distance: number;
    load: number;
    arrivalTimes: number[];
}

export interface AlgorithmStats {
    executionTime: number;
    iterations?: number;
    bestSolution?: number;
    convergence?: number;
}

export interface SolutionData {
    totalDistance: number;
    totalTime: number;
    vehiclesUsed: number;
    routes: RouteData[];
    algorithmStats: AlgorithmStats;
}

export interface VrpSolveRequest {
    customers: Location[]; // Exclude depot from customers
    vehicle: {
        capacity: number;
        count: number;
    };
    depot: {
        lat: number;
        lon: number;
    };
    additionalArgs?: string;
}

export interface VrpSolveResponse {
    problemType: string;
    status: string;
    message: string;
    solution: SolutionData | undefined;
}