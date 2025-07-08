import * as types from '../constants/actionTypes';

const initialState = {
    activeTab: 'routing',
    userRole: 'end-user',
    uploadStatus: ''
};

export default function uiReducer(state = initialState, action: any) {
    switch (action.type) {
        case types.SET_ACTIVE_TAB:
            return {
                ...state,
                activeTab: action.payload
            };
        case types.SET_USER_ROLE:
            return {
                ...state,
                userRole: action.payload
            };
        case types.SET_UPLOAD_STATUS:
            return {
                ...state,
                uploadStatus: action.payload
            };
        default:
            return state;
    }
}