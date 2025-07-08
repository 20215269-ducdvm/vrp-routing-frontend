import { solveRoutes } from '../../services/solveVRP';
import { AppDispatch } from '../store';
import { setResults, setIsCalculating } from '../actions/routingActions';
import { setUploadStatus } from '../actions/uiActions';
import { handleCSVUpload, handleGeoJSONUpload, handleJSONUpload } from '../../services/fileHandlers';

export const calculateRoutes = (requestData: any) => async (dispatch: AppDispatch) => {
    dispatch(setIsCalculating(true));

    try {
        const results = await solveRoutes(requestData);
        dispatch(setResults(results));
    } catch (error) {
        console.error('Error calculating routes:', error);
        alert('Error calculating routes. Please try again later.');
    } finally {
        dispatch(setIsCalculating(false));
    }
};

export const uploadFile = (file: File, locations: any[]) => async (dispatch: AppDispatch) => {
    if (!file) return;
    const ext = file.name.split('.').pop();
    dispatch(setUploadStatus('Đang xử lý tệp...'));

    const processData = (data: any) => {
        // Create a new locations array with depot and customers
        const newLocations: any[] = [];

        // Add depot if available
        if (data.depot) {
            newLocations.push({...data.depot, type: 'depot'});
        } else if (locations.length > 0 && locations[0].type === 'depot') {
            // Keep existing depot if new data doesn't have one
            newLocations.push(locations[0]);
        }

        // Add customers
        if (data.customers) {
            data.customers.forEach((customer: any) => {
                newLocations.push({...customer, type: 'customer'});
            });
        }

        return newLocations;
    };

    switch (ext) {
        case 'json':
            handleJSONUpload(file, (data) => {
                const newLocations = processData(data);
                dispatch(setUploadStatus('Tải lên thành công'));
                return newLocations;
            });
            break;
        case 'csv':
            handleCSVUpload(file, (data) => {
                const newLocations = processData(data);
                dispatch(setUploadStatus('Tải lên thành công'));
                return newLocations;
            });
            break;
        case 'geojson':
            handleGeoJSONUpload(file, (data) => {
                const newLocations = processData(data);
                dispatch(setUploadStatus('Tải lên thành công'));
                return newLocations;
            });
            break;
        default:
            dispatch(setUploadStatus('Định dạng tệp không được hỗ trợ'));
    }
};