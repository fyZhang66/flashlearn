import React, { useReducer, useEffect } from 'react';
import api from '../api';
import { editModalReducer, initialModalState, MODAL_ACTIONS } from '../reducers/editModalReducer';
import './CardManage.css';

function EditCardModal({ card, onClose, onSuccess }) {
  const [state, dispatch] = useReducer(editModalReducer, {
    ...initialModalState,
    front: card.front,
    explain: card.explain
  });
  
  const { front, explain, isLoading, showConfirm, errorMessage } = state;

  useEffect(() => {
    dispatch({ 
      type: MODAL_ACTIONS.RESET_FORM, 
      payload: { front: card.front, explain: card.explain } 
    });
  }, [card]);

  const handleInputChange = (field, value) => {
    dispatch({
      type: MODAL_ACTIONS.SET_FORM_DATA,
      field,
      value
    });
  };

  const validateInputs = () => {
    dispatch({ type: MODAL_ACTIONS.CLEAR_ERROR });
    
    if (!front.trim()) {
      dispatch({ 
        type: MODAL_ACTIONS.SET_ERROR, 
        payload: 'required-front' 
      });
      return false;
    }
    
    if (!explain.trim()) {
      dispatch({ 
        type: MODAL_ACTIONS.SET_ERROR, 
        payload: 'required-explain' 
      });
      return false;
    }
    
    return true;
  };

  const handleShowConfirm = (e) => {
    e.preventDefault();
    if (validateInputs()) {
      dispatch({ 
        type: MODAL_ACTIONS.SET_CONFIRM_MODE, 
        payload: true 
      });
    }
  };

  const handleCancelConfirm = () => {
    dispatch({ 
      type: MODAL_ACTIONS.SET_CONFIRM_MODE, 
      payload: false 
    });
  };

  const handleConfirmedSubmit = () => {
    dispatch({ type: MODAL_ACTIONS.SET_LOADING, payload: true });
    
    api.updateCard(card.cardId, { front, explain })
      .then(updatedCard => {
        dispatch({ type: MODAL_ACTIONS.SET_LOADING, payload: false });
        onSuccess(updatedCard);
      })
      .catch(err => {
        dispatch({ type: MODAL_ACTIONS.SET_LOADING, payload: false });
        dispatch({ 
          type: MODAL_ACTIONS.SET_ERROR, 
          payload: err.error || 'update-card-error' 
        });
        dispatch({ type: MODAL_ACTIONS.SET_CONFIRM_MODE, payload: false });
      });
  };

  if (showConfirm) {
    return (
      <div className="modal-overlay">
        <div className="edit-modal confirm-modal">
          <div className="modal-header">
            <h3>Confirm Update</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="confirm-content">
            <p>Are you sure you want to update this card?</p>
            
            <div className="card-preview">
              <div className="preview-item">
                <h4>Front (Question):</h4>
                <p>{front}</p>
              </div>
              <div className="preview-item">
                <h4>Back (Answer):</h4>
                <p>{explain}</p>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancelConfirm}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleConfirmedSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="edit-modal">
        <div className="modal-header">
          <h3>Edit Card</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {errorMessage && <div className="card-error">{errorMessage}</div>}
        
        <form onSubmit={handleShowConfirm} className="edit-card-form">
          <div className="form-group">
            <label htmlFor="edit-front">Front (Question)</label>
            <input
              id="edit-front"
              type="text"
              value={front}
              onChange={(e) => handleInputChange('front', e.target.value)}
              placeholder="Enter the question or term"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="edit-explain">Back (Answer)</label>
            <textarea
              id="edit-explain"
              value={explain}
              onChange={(e) => handleInputChange('explain', e.target.value)}
              placeholder="Enter the answer or explanation"
              rows="4"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
            >
              Update Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCardModal;