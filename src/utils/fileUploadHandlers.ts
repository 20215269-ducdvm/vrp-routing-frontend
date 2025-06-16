export const handleJSONUpload = (content: string, setDepotLocation: any, setCustomers: any, setVehicles: any) => {
    const data = JSON.parse(content);
    if (data.depot) setDepotLocation(data.depot);
    if (data.customers) setCustomers(data.customers);
    if (data.vehicles) setVehicles(data.vehicles);
};

export const handleCSVUpload = (content: string, setCustomers: any) => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const customers = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const customer: any = {};
        headers.forEach((header, index) => {
            customer[header] = values[index];
        });
        return customer;
    });
    setCustomers(customers);
};

export const handleGeoJSONUpload = (content: string, setDepotLocation: any, setCustomers: any) => {
    const geojson = JSON.parse(content);
    const customers = geojson.features.map((feature: any) => ({
        id: feature.properties.id,
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        name: feature.properties.name,
    }));
    setCustomers(customers);
};