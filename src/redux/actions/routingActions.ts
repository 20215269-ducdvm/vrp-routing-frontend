    import * as types from '../constants/actionTypes';
import {Location} from "../types/location";
import {VrpSolveResponse} from "../types/vrpSolveResponse";

export const setProblemType = (problemType: string) => ({
    type: types.SET_PROBLEM_TYPE,
    payload: problemType
});

export const setAlgorithm = (algorithm: string) => ({
    type: types.SET_ALGORITHM,
    payload: algorithm
});

export const setVehicles = (vehicles: any[]) => ({
    type: types.SET_VEHICLES,
    payload: vehicles
});

export const setLocations = (locations: Location[]) => ({
    type: types.SET_LOCATIONS,
    payload: locations
});

export const setResults = (results: VrpSolveResponse | null) => ({
    type: types.SET_RESULTS,
    payload: results
});

export const setIsCalculating = (isCalculating: boolean) => ({
    type: types.SET_IS_CALCULATING,
    payload: isCalculating
});