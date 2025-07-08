import {Location} from "../types/location";

export const defaultLocations: Location[] = [
    {id: 0, lat: 21.0285, lon: 105.8542, name: 'Kho chính', type: 'depot', demand: 0, timeWindow: [0, 24]},
    {
        id: 1,
        lat: 21.0245,
        lon: 105.8412,
        name: 'Khách hàng 1 - Hoàn Kiếm',
        type: 'customer',
        demand: 150,
        timeWindow: [8, 10]
    },
    {
        id: 2,
        lat: 21.0325,
        lon: 105.8372,
        name: 'Khách hàng 2 - Ba Đình',
        type: 'customer',
        demand: 250,
        timeWindow: [9, 11]
    },
    {
        id: 3,
        lat: 21.0185,
        lon: 105.8502,
        name: 'Khách hàng 3 - Hai Bà Trưng',
        type: 'customer',
        demand: 200,
        timeWindow: [10, 12]
    },
    {
        id: 4,
        lat: 21.0365,
        lon: 105.8602,
        name: 'Khách hàng 4 - Đống Đa',
        type: 'customer',
        demand: 300,
        timeWindow: [11, 13]
    },
    {
        id: 5,
        lat: 21.0205,
        lon: 105.8282,
        name: 'Khách hàng 5 - Tây Hồ',
        type: 'customer',
        demand: 180,
        timeWindow: [13, 15]
    },
];