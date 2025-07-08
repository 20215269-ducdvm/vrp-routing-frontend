import {Location} from "./location";

export interface RouteData {
    vehicleId: number;
    customers: (Location | null)[];
    distance: number;
    load: number;
    arrivalTimes: number[];
}