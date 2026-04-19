# FlashLearn Technical Documentation

This document provides a technical overview of the FlashLearn spaced repetition flashcard system, covering both front-end and back-end architecture.

## System Architecture

FlashLearn follows a client-server architecture:

- **Front-end**: React-based Single Page Application (SPA) built with Vite
- **Back-end**: Express.js RESTful API server
- **State Management**: Context API and useReducer for state management
- **Data Storage**: In-memory storage (server-side)

## Back-end Architecture

### Server Setup

The server is built with Express.js and uses a modular approach with route separation

### API Endpoints

The server provides the following RESTful API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session` | GET | Check user session status |
| `/api/session` | POST | Log in user |
| `/api/session` | DELETE | Log out user |
| `/api/register` | POST | Register a new user |
| `/api/cards` | GET | Get all cards (can filter by status) |
| `/api/cards/next` | GET | Get the next card for review |
| `/api/cards/stats` | GET | Get card statistics |
| `/api/card` | POST | Create a new card |
| `/api/card/:id` | PUT | Update an existing card |
| `/api/card/:id` | DELETE | Delete a card |
| `/api/card/:id/review` | POST | Submit a card review |

### Route Implementations

#### Authentication Routes (`/routes/auth.js`)

These routes handle user sessions, login, and logout operations:

- **GET /api/session**

- **POST /api/session**

- **DELETE /api/session**

#### Registration Routes (`/routes/register.js`)

These routes handle new user account creation:

- **POST /api/register**

#### Card Routes (`/routes/card.js`)

These routes handle operations on individual flashcards:

- **POST /api/card**

- **PUT /api/card/:cardId**

- **DELETE /api/card/:cardId**

- **POST /api/card/:cardId/review**

#### Cards Collection Routes (`/routes/cards.js`)

These routes handle operations on collections of flashcards:

- **GET /api/cards**

- **GET /api/cards/next**

- **GET /api/cards/stats**

### Data Model

All data is stored in memory using JavaScript objects:

- **User data**: Stored with username as the key
- **Card data**: Each user has an array of card objects with the following structure:
  ```javascript
  {
    cardId: String,           // UUID for the card
    front: String,            // Question/term on the front
    explain: String,          // Answer/explanation on the back
    expireMs: Number,         // Milliseconds until card is due again
    createdAt: String,        // ISO date string
    lastReviewed: String      // ISO date string or null
  }
  ```

### Service Models

The application uses two primary service models that manage the core functionality:

#### User Management (`user-management.js`)

The User Management module handles user-related functionality:

- **User Registration and Validation**:
  - `isValidUsername()`: Validates usernames using alphanumeric pattern matching
  - `isUserRegistered()`: Checks if a username exists in the system
  - `registerUser()`: Adds a new user to the system

This module maintains a simple in-memory set of registered users, separating user management from card functionality.

#### Cards Manager (`cards-manager.js`)

The Cards Manager module handles all flashcard operations:

- **Card Creation and User Integration**:
  - `initCardsForUser()`: Sets up initial card storage for a new user
  - `registerUserWithCards()`: Combines user registration with card initialization

- **Card Management**:
  - `addCard()`: Creates a new flashcard with default spaced repetition parameters
  - `getCards()`: Retrieves all cards for a specific user
  - `getCardsByStatus()`: Filters cards by learning status (unlearned, due, learned, all)
  - `getCard()`: Retrieves a single card by ID
  - `updateCard()`: Modifies an existing card's content
  - `deleteCard()`: Removes a card from a user's collection

- **Spaced Repetition Logic**:
  - `reviewCard()`: Updates a card's spaced repetition schedule based on review feedback
  - `getDueCards()`: Identifies cards due for review based on their scheduling
  - `getUnlearnedCount()`: Counts cards that have never been reviewed
  - `getDueCount()`: Counts cards currently due for review
  - `getCardStats()`: Generates statistics about a user's flashcard collection

The Cards Manager uses an in-memory object (`cardsFor`) to store each user's flashcards, with usernames as keys. The flashcard review system implements a simple but effective spaced repetition algorithm where intervals increase exponentially for well-known cards.

#### Session Model (`sessions.js`)

The Session model manages user authentication state:

- **Session Creation**:
  - `addSession()`: Creates a new session when a user logs in, generating a unique UUID as session ID

- **Session Verification**:
  - `getSessionUser()`: Retrieves the username associated with a session ID

- **Session Termination**:
  - `deleteSession()`: Removes a session when a user logs out

Sessions are stored in memory using a simple object structure where session IDs are keys and user information are values. This authentication system is stateful, with session IDs transmitted between client and server via cookies.

## Front-end Architecture

### Application Structure

The React application is structured as follows:

```
src/
├── api/                 # API service functions
├── assets/              # SVG icons
├── components/          # React component files
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── reducers/            # State reducers for complex components
├── App.css              # Main application styles
├── App.jsx              # Main application component
└── main.jsx             # Application entry point
```

### State Management

The application uses React's Context API for global state management:

- **UserContext**: Manages authentication state and user information
- **TabContext**: Manages active tab navigation
- **StatsContext**: Manages flashcard statistics state
  - Implements automatic polling to keep statistics up-to-date

Each context provides both state and functions to update that state.

### Real-time Data Updates

The application implements a polling mechanism to keep the user's statistics current without requiring manual refreshes:

1. **Automatic Polling**: The `StatsContext` uses `setInterval` to periodically fetch updated statistics from the server
2. **Conditional Polling**: Polling only occurs when the user is logged in
3. **Manual Refresh**: In addition to automatic polling, the application provides functions to manually trigger data refreshes when needed (after creating/updating/deleting cards)

This approach ensures that users always see current information about their flashcards, particularly important for the spaced repetition system where cards become due for review at specific times.

### Key Components

1. **AppContent**: Main container for the application
2. **Header**: Contains navigation, user info, and logout
3. **NavTabs**: Navigation between main application sections
4. **Login/Register**: User authentication forms
5. **CreateCard**: Form for creating new flashcards
6. **CardManage**: Interface for managing existing cards
7. **Review**: Interface for reviewing cards using spaced repetition
8. **CardList**: Displays cards with filtering options
9. **EditCardModal**: Modal for editing existing cards

### API Service Layer

The application uses a centralized API service layer (`src/api/index.js`) that handles all communication with the back end:

- Consistent error handling
- JSON parsing
- Authentication handling
- Standard request/response structure

## Spaced Repetition Algorithm

The system implements a simple but effective spaced repetition algorithm:

1. New cards (never reviewed) are prioritized for review
2. When a card is reviewed, the user rates their performance:
   - **Hard**: Card will be shown again in 5 minutes
   - **Good**: Card will be shown again in 1 day
   - **Easy**: The current interval doubles

The algorithm automatically schedules reviews to optimize memory retention.

## Design Patterns

1. **Component Composition**: Breaking UI into reusable components
2. **Provider Pattern**: Using Context to provide state to component trees
3. **Custom Hooks**: Extracting reusable stateful logic
4. **Reducer Pattern**: Using useReducer for complex state management