import { useState } from 'react';
import api from '../api';
import './CreateCard.css';
import { useStats } from '../contexts/StatsContext';
import useError from '../hooks/useError';

function CreateCard() {
    const { fetchStats } = useStats();
    const { errorMessage, setError, clearError } = useError();
    const [front, setFront] = useState('');
    const [explain, setExplain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        clearError();
        setSuccess('');
        
        if (!front.trim()) {
            setError('required-front');
            return;
        }
        
        if (!explain.trim()) {
            setError('required-explain');
            return;
        }
        
        setIsLoading(true);
        
        api.addCard(front, explain)
            .then(card => {
                setSuccess('Card created successfully!');
                setFront('');
                setExplain('');
                fetchStats();
            })
            .catch(err => {
                setError('create-card-error');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className="create-card-page">
            <div className="create-card-container">
                <div className="create-card-header">
                    <h2>Create a New Flashcard</h2>
                </div>
                
                {errorMessage && <div className="card-error">{errorMessage}</div>}
                {success && <div className="card-success">{success}</div>}
                
                <form onSubmit={handleSubmit} className="create-card-form">
                    <div className="form-group">
                        <label htmlFor="card-front">Front (Question)</label>
                        <input
                            id="card-front"
                            type="text"
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            placeholder="Enter the question or term"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="card-explain">Back (Answer)</label>
                        <textarea
                            id="card-explain"
                            value={explain}
                            onChange={(e) => setExplain(e.target.value)}
                            placeholder="Enter the answer or explanation"
                            rows="4"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => {
                                setFront('');
                                setExplain('');
                                clearError();
                                setSuccess('');
                            }}
                            disabled={isLoading}
                        >
                            Clear Form
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : 'Create Card'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="create-card-tips">
                <h3>Tips for Good Flashcards:</h3>
                <ul>
                    <li>Keep questions clear and specific</li>
                    <li>Use your own words in the explanation</li>
                    <li>Include only one concept per card</li>
                    <li>For language learning, include example sentences</li>
                </ul>
            </div>
        </div>
    );
}

export default CreateCard;