import { combineReducers } from 'redux';
import uiReducer from './uiReducer';
import routingReducer from './routingReducer';

const rootReducer = combineReducers({
    ui: uiReducer,
    routing: routingReducer
});

export default rootReducer;