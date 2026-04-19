export default {
  checkSession: () => {
    return fetch("/api/session")
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  login: (username) => {
    return fetch("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    })
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  register: (username) => {
    return fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    })
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  logout: () => {
    return fetch("/api/session", {
      method: "DELETE",
    })
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  getCards: (status = 'all') => {
    const url = status === 'all' 
      ? '/api/cards' 
      : `/api/cards?status=${status}`;
      
    return fetch(url)
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  addCard: (front, explain, expireDays = 7) => {
    return fetch("/api/card", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ front, explain, expireDays }),
    })
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  updateCard: (cardId, updates) => {
    return fetch(`/api/card/${cardId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  deleteCard: (cardId) => {
    return fetch(`/api/card/${cardId}`, {
      method: "DELETE",
    })
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  getNextCard: () => {
    return fetch("/api/cards/next")
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  reviewCard: (cardId, reviewOption) => {
    return fetch(`/api/card/${cardId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reviewOption }),
    })
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },

  getCardStats: () => {
    return fetch("/api/cards/stats")
      .catch((err) => Promise.reject({ error: "network-error" }))
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      });
  },
};
