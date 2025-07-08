import * as types from '../constants/actionTypes';

export const setActiveTab = (tab: string) => ({
    type: types.SET_ACTIVE_TAB,
    payload: tab
});

export const setUserRole = (role: string) => ({
    type: types.SET_USER_ROLE,
    payload: role
});

export const setUploadStatus = (status: string) => ({
    type: types.SET_UPLOAD_STATUS,
    payload: status
});