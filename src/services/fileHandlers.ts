export function handleJSONUpload(file: File, callback: (data: any) => void) {
    const reader = new FileReader();
    reader.onload = (e) => {
        if (!e.target?.result) return;
        const content = JSON.parse(e.target.result as string);
        callback(content);
    };
    reader.readAsText(file);
}

export function handleCSVUpload(file: File, callback: (data: any) => void) {
    const reader = new FileReader();
    reader.onload = (e) => {
        if (!e.target?.result) return;
        const text = e.target.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        callback(rows);
    };
    reader.readAsText(file);
}

export function handleGeoJSONUpload(file: File, callback: (data: any) => void) {
    const reader = new FileReader();
    reader.onload = (e) => {
        if (!e.target?.result) return;
        const geojson = JSON.parse(e.target.result as string);
        callback(geojson);
    };
    reader.readAsText(file);
}