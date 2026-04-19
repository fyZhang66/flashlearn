export const MODAL_ACTIONS = {
  SET_FORM_DATA: 'SET_FORM_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_CONFIRM_MODE: 'SET_CONFIRM_MODE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_FORM: 'RESET_FORM'
};

export const initialModalState = {
  front: '',
  explain: '',
  isLoading: false,
  showConfirm: false,
  errorMessage: ''
};

export function editModalReducer(state, action) {
  switch (action.type) {
    case MODAL_ACTIONS.SET_FORM_DATA:
      return {
        ...state,
        [action.field]: action.value
      };
    
    case MODAL_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case MODAL_ACTIONS.SET_CONFIRM_MODE:
      return {
        ...state,
        showConfirm: action.payload
      };
    
    case MODAL_ACTIONS.SET_ERROR:
      return {
        ...state,
        errorMessage: action.payload
      };
    
    case MODAL_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        errorMessage: ''
      };
    
    case MODAL_ACTIONS.RESET_FORM:
      return {
        ...initialModalState,
        front: action.payload.front,
        explain: action.payload.explain
      };
    
    default:
      return state;
  }
}