import { useReducer, useEffect } from 'react';
import { useStats } from '../contexts/StatsContext';
import { formatDate } from '../utils/dateUtils';
import CardStats from './CardStats';
import CardList from './CardList';
import { cardsReducer, initialState, fetchCards, deleteCard, updateCard, setFilter, setEditingCard, setDeletingCard } from '../reducers/cardsReducer';
import './CardManage.css';

function CardManage() {
  const [state, dispatch] = useReducer(cardsReducer, initialState);
  const { cards, activeFilter, isLoading, errorMessage, notification } = state;
  const { fetchStats } = useStats();
  
  useEffect(() => {
    handleFetchCards(activeFilter);
  }, [activeFilter]);
  
  const handleFetchCards = (status) => {
    fetchCards(dispatch, status)
  };
  
  const handleDeleteCard = (cardId) => {
    deleteCard(dispatch, cardId)
      .then(() => {
        fetchStats();
      })
  };
  
  const handleCardUpdate = (updatedCard) => {
    updateCard(dispatch, updatedCard);
    fetchStats();
  };
  
  const handleRefresh = () => {
    handleFetchCards(activeFilter);
    fetchStats();
  };
  
  const handleSetFilter = (filter) => {
    setFilter(dispatch, filter);
  };
  
  const handleSetEditingCard = (card) => {
    setEditingCard(dispatch, card);
  };
  
  const handleSetDeletingCard = (card) => {
    setDeletingCard(dispatch, card);
  };
  
  const getStatusLabel = (card) => {
    if (!card.lastReviewed) {
      return <span className="status-badge unlearned">Not Learned</span>;
    }
    
    const now = new Date();
    const lastReviewed = new Date(card.lastReviewed);
    const dueDate = new Date(lastReviewed);
    dueDate.setTime(dueDate.getTime() + card.expireMs);
    
    if (now >= dueDate) {
      return <span className="status-badge due">Due</span>;
    }
    
    return <span className="status-badge learned">Learned</span>;
  };
  
  return (
    <div className="card-manage-container">
      <CardStats />
      
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleSetFilter('all')}
        >
          All Cards
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'unlearned' ? 'active' : ''}`}
          onClick={() => handleSetFilter('unlearned')}
        >
          Not Learned
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'due' ? 'active' : ''}`}
          onClick={() => handleSetFilter('due')}
        >
          Due for Review
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'learned' ? 'active' : ''}`}
          onClick={() => handleSetFilter('learned')}
        >
          Learned
        </button>
        <button className="refresh-btn" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading cards...</p>
        </div>
      ) : (
        <CardList 
          cards={cards} 
          getStatusLabel={getStatusLabel} 
          formatDate={formatDate} 
          handleDeleteCard={handleDeleteCard} 
          handleCardUpdate={handleCardUpdate}
          editingCard={state.editingCard}
          deletingCard={state.deletingCard}
          setEditingCard={handleSetEditingCard}
          setDeletingCard={handleSetDeletingCard}
        />
      )}
    </div>
  );
}

export default CardManage;