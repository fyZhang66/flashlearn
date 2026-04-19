import { useState, useEffect } from 'react';
import CardStats from './CardStats';
import api from '../api';
import './Review.css';
import { useStats } from '../contexts/StatsContext';
import useError from '../hooks/useError';

function Review() {
    const { stats, setStats, fetchStats } = useStats();
    const { errorMessage, setError, clearError } = useError();
    const [currentCard, setCurrentCard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);
    const [remainingCards, setRemainingCards] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    const getProgressClass = () => {
        if (!stats.due || stats.due === 0) return 'progress-0';
        
        const percentage = ((stats.due - remainingCards) / stats.due) * 100;
        const roundedToTen = Math.round(percentage / 10) * 10;
        
        const boundedPercentage = Math.max(0, Math.min(100, roundedToTen));
        
        return `progress-${boundedPercentage}`;
    };

    useEffect(() => {
        if (stats.due > 0) {
            fetchNextCard();
        } else {
            setIsLoading(false);
        }
    }, [stats.due]);


    const fetchNextCard = () => {
        setIsLoading(true);
        setIsFlipped(false);
        setShowAnswer(false);
        clearError();
        
        api.getNextCard()
            .then(data => {
                if (data.done) {
                    setCurrentCard(null);
                } else {
                    setCurrentCard(data.card);
                    setRemainingCards(data.remaining);
                }
                setIsLoading(false);
            })
            .catch(err => {
                setError('load-card-error');
                setIsLoading(false);
            });
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        setShowAnswer(true);
    };

    const handleReview = (reviewOption) => {
        if (!currentCard) return;
        clearError();
        
        api.reviewCard(currentCard.cardId, reviewOption)
            .then(data => {
                setStats(data.stats);
                fetchNextCard();
            })
            .catch(err => {
                setError('review-card-error');
            });
    };

    const restartReview = () => {
        clearError();
        fetchStats();
    };

    if (isLoading) {
        return (
            <div className="review-container">
                <CardStats stats={stats} />
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading cards...</p>
                </div>
            </div>
        );
    }

    if (stats.total === 0) {
        return (
            <div className="review-container">
                <div className="no-cards-message">
                    <h2>Welcome to FlashLearn!</h2>
                    <p>You don't have any flashcards yet. Click the "Create" tab above to create your first card.</p>
                </div>
            </div>
        );
    }

    if (stats.due === 0) {
        return (
            <div className="review-container">
                <CardStats stats={stats} />
                
                <div className="review-complete">
                    <h2>All caught up! 🎉</h2>
                    <p>You've completed all your due reviews. Come back later for more, or create new flashcards in the "Create" tab.</p>
                    <div className="review-actions">
                        <button 
                            className="btn btn-secondary" 
                            onClick={restartReview}
                        >
                            Check Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="review-container">
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            
            <CardStats stats={stats} />
            
            <div className="review-progress">
                <span>Card {stats.due - remainingCards} of {stats.due} due</span>
                <div className="progress-bar">
                    <div className={`progress ${getProgressClass()}`}></div>
                </div>
            </div>
            
            {currentCard && (
                <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
                    <div className="flashcard-inner">
                        <div className="flashcard-front">
                            <div className="card-content">
                                <h3>{currentCard.front}</h3>
                                <p className="card-hint">Click to reveal answer</p>
                            </div>
                        </div>
                        <div className="flashcard-back">
                            <div className="card-content">
                                <h3>{currentCard.front}</h3>
                                <div className="card-explanation">{currentCard.explain}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showAnswer && (
                <div className="review-buttons">
                    <button className="review-btn hard" onClick={() => handleReview('hard')} > Again (5m) </button>
                    <button className="review-btn good" onClick={() => handleReview('good')} > Good (1d) </button>
                    <button className="review-btn easy" onClick={() => handleReview('easy')} > Easy (×2) </button>
                </div>
            )}
        </div>
    );
}

export default Review;