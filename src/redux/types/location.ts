export interface Location {
    id: number;
    lat: number;
    lon: number;
    name: string;
    type: string;
    demand: number;
    timeWindow?: number[];
}