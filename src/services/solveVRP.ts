import axios from 'axios';

import {Location} from "../redux/types/location";
import {Vehicle} from "../redux/types/vehicle";
import {VrpSolveRequest} from "../redux/types/vrpSolveRequest";
import {VrpSolveResponse} from "../redux/types/vrpSolveResponse";
import {defaultLocations} from "../redux/constants/DefaultLocations";

export const solveRoutes = async (requestData: {
    problemType: string;
    algorithm: string;
    vehicles: Vehicle[];
    depot: Location;
    customers: Location[];
}): Promise<VrpSolveResponse> => {
    const transformedData: VrpSolveRequest = {
        customers: requestData.customers.map(customer => ({
            id: customer.id,
            lat: customer.lat,
            lon: customer.lon,
            demand: customer.demand ?? 1 // Use demand as weight or default to 1
        })) as any, // Use type assertion to bypass type checking for this transformation
        vehicle: {
            capacity: requestData.vehicles[0]?.capacity || 30,
            count: requestData.vehicles.length || 1
        },
        depot: {
            lat: requestData.depot.lat,
            lon: requestData.depot.lon
        },
        additionalArgs: "" // Default runtime limit
    };
    console.log(transformedData);
    try {
        const API_URL = process.env.REACT_APP_API_URL;
        const response = await axios.post(`${API_URL}/api/vrp/solve`, transformedData, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        let responseData = response.data;
        console.log(responseData);
        return {
            problemType: requestData.problemType,
            status: responseData.status,
            message: responseData.message,
            solution: {
                totalDistance: responseData.solution.totalDistance,
                totalTime: responseData.solution.totalTime,
                vehiclesUsed: responseData.solution.vehiclesUsed,
                routes: responseData.solution.routes.map((route: any) => ({
                    vehicleId: route.vehicleId,
                    customers: route.customerSequence.map((customer: any) => (
                        defaultLocations.find(location => location.id === customer) || {}
                    )),
                    distance: route.routeDistance,
                    load: route.routeLoad,
                    arrivalTimes: route.arrivalTimes
                })),
                algorithmStats: {
                    executionTime: responseData.solution.algorithmStats.executionTime,
                    iterations: responseData.solution.algorithmStats.iterations,
                    bestSolution: responseData.solution.algorithmStats.bestSolution,
                    convergence: responseData.solution.algorithmStats.convergence
                }
            }
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data || error.message;
            throw new Error(`Server error: ${errorMessage}`);
        }
        throw error;
    }
};