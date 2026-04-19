import React from 'react';
import './CardManage.css';
import EditCardModal from './EditCardModal';

function CardList({ cards, getStatusLabel, formatDate, handleDeleteCard, handleCardUpdate, editingCard, deletingCard, setEditingCard, setDeletingCard }) {
  const handleEditClick = (card) => {
    setEditingCard(card);
  };

  const closeEditModal = () => {
    setEditingCard(null);
  };

  const handleDeleteClick = (card) => {
    setDeletingCard(card);
  };

  const cancelDelete = () => {
    setDeletingCard(null);
  };

  const confirmDelete = (cardId) => {
    handleDeleteCard(cardId);
  };

  const handleEditSuccess = (updatedCard) => {
    handleCardUpdate(updatedCard);
  };

  if (cards.length === 0) {
    return (
      <div className="no-cards-message">
        <p>No cards found in this category. Try selecting a different filter or create new cards.</p>
      </div>
    );
  }

  return (
    <>
      <div className="cards-list">
        {cards.map(card => (
          <div className="card-item" key={card.cardId}>
            <div className="card-content">
              <div className="card-header">
                <h3>{card.front}</h3>
                {getStatusLabel(card)}
              </div>
              <div className="card-explanation">{card.explain}</div>
              <div className="card-meta">
                <div className="meta-item">
                  <span className="meta-label">Created:</span>
                  <span className="meta-value">{formatDate(card.createdAt)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Last Reviewed:</span>
                  <span className="meta-value">{formatDate(card.lastReviewed)}</span>
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button 
                className="action-btn edit-btn" 
                onClick={() => handleEditClick(card)}
              >
                Edit
              </button>
              <button 
                className="action-btn delete-btn" 
                onClick={() => handleDeleteClick(card)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {editingCard && (
        <EditCardModal 
          card={editingCard} 
          onClose={closeEditModal} 
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingCard && (
        <div className="modal-overlay">
          <div className="edit-modal confirm-modal">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="close-btn" onClick={cancelDelete}>×</button>
            </div>
            
            <div className="confirm-content">
              <p>Are you sure you want to delete this card?</p>
              
              <div className="card-preview">
                <div className="preview-item">
                  <h4>Front (Question):</h4>
                  <p>{deletingCard.front}</p>
                </div>
                <div className="preview-item">
                  <h4>Back (Answer):</h4>
                  <p>{deletingCard.explain}</p>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-delete" 
                  onClick={() => confirmDelete(deletingCard.cardId)}
                >
                  Delete Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CardList;