import api from '../api';

export const ACTIONS = {
  FETCH_CARDS_REQUEST: 'FETCH_CARDS_REQUEST',
  FETCH_CARDS_SUCCESS: 'FETCH_CARDS_SUCCESS',
  FETCH_CARDS_FAILURE: 'FETCH_CARDS_FAILURE',
  DELETE_CARD_REQUEST: 'DELETE_CARD_REQUEST',
  DELETE_CARD_SUCCESS: 'DELETE_CARD_SUCCESS',
  DELETE_CARD_FAILURE: 'DELETE_CARD_FAILURE',
  UPDATE_CARD_SUCCESS: 'UPDATE_CARD_SUCCESS',
  SET_FILTER: 'SET_FILTER',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  SET_EDITING_CARD: 'SET_EDITING_CARD',
  SET_DELETING_CARD: 'SET_DELETING_CARD'
};


export const initialState = {
  cards: [],
  activeFilter: 'all',
  isLoading: false,
  errorMessage: '',
  notification: { message: '', type: '' },
  editingCard: null,
  deletingCard: null
};

export function cardsReducer(state, action) {
  switch (action.type) {
    case ACTIONS.FETCH_CARDS_REQUEST:
      return {
        ...state,
        isLoading: true,
        errorMessage: ''
      };
    
    case ACTIONS.FETCH_CARDS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        cards: action.payload,
        errorMessage: ''
      };
    
    case ACTIONS.FETCH_CARDS_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessage: action.payload || 'Failed to load cards'
      };
    
    case ACTIONS.DELETE_CARD_REQUEST:
      return {
        ...state,
        cards: state.cards.map(card => 
          card.cardId === action.payload 
            ? { ...card, isDeleting: true } 
            : card
        )
      };
    
    case ACTIONS.DELETE_CARD_SUCCESS:
      return {
        ...state,
        cards: state.cards.filter(card => card.cardId !== action.payload),
        notification: { 
          message: 'Card deleted successfully!', 
          type: 'success' 
        },
        deletingCard: null
      };
    
    case ACTIONS.DELETE_CARD_FAILURE:
      return {
        ...state,
        cards: state.cards.map(card => 
          card.cardId === action.payload 
            ? { ...card, isDeleting: false } 
            : card
        ),
        notification: { 
          message: 'Failed to delete card', 
          type: 'error' 
        },
        errorMessage: 'card-not-found',
        deletingCard: null
      };
    
    case ACTIONS.UPDATE_CARD_SUCCESS:
      return {
        ...state,
        cards: state.cards.map(card => 
          card.cardId === action.payload.cardId 
            ? action.payload 
            : card
        ),
        notification: { 
          message: 'Card updated successfully!', 
          type: 'success' 
        },
        editingCard: null
      };
    
    case ACTIONS.SET_FILTER:
      return {
        ...state,
        activeFilter: action.payload
      };
    
    case ACTIONS.SET_NOTIFICATION:
      return {
        ...state,
        notification: action.payload
      };
    
    case ACTIONS.CLEAR_NOTIFICATION:
      return {
        ...state,
        notification: { message: '', type: '' }
      };
    
    case ACTIONS.SET_EDITING_CARD:
      return {
        ...state,
        editingCard: action.payload
      };
    
    case ACTIONS.SET_DELETING_CARD:
      return {
        ...state,
        deletingCard: action.payload
      };
    
    default:
      return state;
  }
}


export const fetchCards = (dispatch, status) => {
  dispatch({ type: ACTIONS.FETCH_CARDS_REQUEST });
  
  return api.getCards(status)
    .then(data => {
      dispatch({ 
        type: ACTIONS.FETCH_CARDS_SUCCESS, 
        payload: data 
      });
      return data;
    })
    .catch(err => {
      dispatch({ 
        type: ACTIONS.FETCH_CARDS_FAILURE, 
        payload: err.error || 'Failed to load cards' 
      });
      throw err;
    });
};

export const deleteCard = (dispatch, cardId) => {
  dispatch({ 
    type: ACTIONS.DELETE_CARD_REQUEST, 
    payload: cardId 
  });
  
  return api.deleteCard(cardId)
    .then(() => {
      dispatch({ 
        type: ACTIONS.DELETE_CARD_SUCCESS, 
        payload: cardId 
      });
      
      setTimeout(() => {
        dispatch({ type: ACTIONS.CLEAR_NOTIFICATION });
      }, 3000);
      
      return cardId;
    })
    .catch(err => {
      dispatch({ 
        type: ACTIONS.DELETE_CARD_FAILURE, 
        payload: cardId 
      });
      
      setTimeout(() => {
        dispatch({ type: ACTIONS.CLEAR_NOTIFICATION });
      }, 3000);
      
      throw err;
    });
};

export const updateCard = (dispatch, updatedCard) => {
  dispatch({ 
    type: ACTIONS.UPDATE_CARD_SUCCESS, 
    payload: updatedCard 
  });
  
  setTimeout(() => {
    dispatch({ type: ACTIONS.CLEAR_NOTIFICATION });
  }, 3000);
  
  return updatedCard;
};

export const setFilter = (dispatch, filter) => {
  dispatch({ 
    type: ACTIONS.SET_FILTER, 
    payload: filter 
  });
  return filter;
};

export const setEditingCard = (dispatch, card) => {
  dispatch({ 
    type: ACTIONS.SET_EDITING_CARD, 
    payload: card 
  });
};

export const setDeletingCard = (dispatch, card) => {
  dispatch({ 
    type: ACTIONS.SET_DELETING_CARD, 
    payload: card 
  });
};