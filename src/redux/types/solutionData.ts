import {RouteData} from "./routeData";
import {AlgorithmStats} from "./algorithmStats";

export interface SolutionData {
    totalDistance: number;
    totalTime: number;
    vehiclesUsed: number;
    routes: RouteData[];
    algorithmStats: AlgorithmStats;
}