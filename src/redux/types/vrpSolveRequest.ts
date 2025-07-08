import {Location} from "./location";

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