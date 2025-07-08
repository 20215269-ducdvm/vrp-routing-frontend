import * as types from '../constants/actionTypes';
import {defaultLocations} from "../constants/DefaultLocations";
import {defaultVehicles} from "../constants/DefaultVehicles";

const initialState = {
    problemType: 'CVRP',
    algorithm: 'harmony-search',
    vehicles: defaultVehicles,
    locations: defaultLocations,
    results: null,
    isCalculating: false
};

export default function routingReducer(state = initialState, action: any) {
    switch (action.type) {
        case types.SET_PROBLEM_TYPE:
            return {
                ...state,
                problemType: action.payload
            };
        case types.SET_ALGORITHM:
            return {
                ...state,
                algorithm: action.payload
            };
        case types.SET_VEHICLES:
            return {
                ...state,
                vehicles: action.payload
            };
        case types.SET_LOCATIONS:
            return {
                ...state,
                locations: action.payload
            };
        case types.SET_RESULTS:
            return {
                ...state,
                results: action.payload
            };
        case types.SET_IS_CALCULATING:
            return {
                ...state,
                isCalculating: action.payload
            };
        default:
            return state;
    }
}