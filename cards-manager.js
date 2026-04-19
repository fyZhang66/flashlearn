import crypto from "node:crypto";
import userManagement from "./user-management.js";
const uuid = crypto.randomUUID;
const cardsFor = {};

const { isValidUsername, isUserRegistered, registerUser } = userManagement;

function initCardsForUser(username) {
  if(!cardsFor[username]) {
    cardsFor[username] = [];
  }
  return cardsFor[username];
}

function registerUserWithCards(username) {
  const registered = registerUser(username);
  if (registered) {
    initCardsForUser(username);
  }
  return registered;
}

function addCard(username, front, explain, expireDays = 7) {
  if(!cardsFor[username]) {
    initCardsForUser(username);
  }
  
  const cardId = uuid();
  const expireMs = expireDays * 24 * 60 * 60 * 1000;
  
  const card = {
    cardId,
    front,
    explain,
    expireMs,
    createdAt: new Date().toISOString(),
    lastReviewed: null
  };
  
  cardsFor[username].push(card);
  return card;
}

function getCards(username) {
  return cardsFor[username] || [];
}

function getCardsByStatus(username, status) {
  let cards = getCards(username);
  
  if (status === 'unlearned') {
    cards = cards.filter(card => !card.lastReviewed);
  } else if (status === 'due') {
    cards = getDueCards(username);
  } else if (status === 'learned') {
    const now = new Date();
    cards = cards.filter(card => {
      if (!card.lastReviewed) return false;
      const lastReviewed = new Date(card.lastReviewed);
      const dueDate = new Date(lastReviewed);
      dueDate.setTime(dueDate.getTime() + card.expireMs);
      return now < dueDate;
    });
  } else{
    cards = getCards(username);
  }
  return cards;
}

function getCard(username, cardId) {
  if(!cardsFor[username]) return null;
  return cardsFor[username].find(card => card.cardId === cardId);
}

function updateCard(username, cardId, updates) {
  if(!cardsFor[username]) return null;
  
  const index = cardsFor[username].findIndex(card => card.cardId === cardId);
  if(index === -1) return null;
  
  const card = cardsFor[username][index];
  const updatedCard = { ...card, ...updates };
  cardsFor[username][index] = updatedCard;
  
  return updatedCard;
}

function deleteCard(username, cardId) {
  if(!cardsFor[username]) return false;
  const initialLength = cardsFor[username].length;
  cardsFor[username] = cardsFor[username].filter(card => card.cardId !== cardId);
  
  return cardsFor[username].length !== initialLength;
}

function reviewCard(username, cardId, reviewOption = 'easy') {
  if(!cardsFor[username]) return null;
  
  const card = getCard(username, cardId);
  if(!card) return null;
  
  const now = new Date();
  const updates = {
    lastReviewed: now.toISOString()
  };
  
  switch(reviewOption) {
    case 'hard':
      //  5 minutes
      updates.expireMs = 300000;
      break;
    case 'good':
      //  1 day
      updates.expireMs = 86400000;
      break;
    case 'easy':
    default:
      updates.expireMs = card.expireMs * 2;
      break;
  }
  
  return updateCard(username, cardId, updates);
}


function getDueCards(username) {
  if(!cardsFor[username]) return [];
  
  const now = new Date();
  return cardsFor[username].filter(card => {
    if(!card.lastReviewed) return true; 
    
    const lastReviewed = new Date(card.lastReviewed);
    const dueDate = new Date(lastReviewed);
    
    dueDate.setTime(dueDate.getTime() + card.expireMs);
    
    return now >= dueDate;
  });
}


function getUnlearnedCount(username) {
  if(!cardsFor[username]) return 0;
  
  return cardsFor[username].filter(card => !card.lastReviewed).length;
}


function getDueCount(username) {
  return getDueCards(username).length;
}


function getCardStats(username) {
  if(!cardsFor[username]) {
    return {
      total: 0,
      unlearned: 0,
      due: 0
    };
  }
  
  const total = cardsFor[username].length;
  const unlearned = getUnlearnedCount(username);
  const due = getDueCount(username);
  
  return {
    total,
    unlearned,
    due
  };
}

export default {
  isValidUsername,
  isUserRegistered,
  registerUserWithCards,
  initCardsForUser,
  addCard,
  getCardsByStatus,
  updateCard,
  deleteCard,
  reviewCard,
  getDueCards,
  getCardStats,
};