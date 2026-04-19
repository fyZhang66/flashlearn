const AUTH_MISSING_MSG = "You must be logged in to use this feature.";
const AUTH_INSUFFICIENT_MSG = "This username is not allowed.";
const INVALID_USERNAME_MSG = "Please enter a valid username.";
const REQUIRED_PASSWORD_MSG = "Password must be at least 6 characters.";
const BAD_PASSWORD_MSG = "Incorrect password.";
const USERNAME_ALREADY_EXISTS = "This username is already taken. Please choose another username.";
const USER_NOT_REGISTERED = "Cannot find user. Please register first.";
const NETWORK_ERROR = "A network error occurred. Please try again.";
const REQUIRED_FRONT_MSG = "Front side cannot be empty.";
const REQUIRED_EXPLAIN_MSG = "Explanation cannot be empty.";
const CARD_NOT_FOUND = "Card not found.";
const LOAD_CARD_ERROR = "Failed to load cards.";
const REVIEW_CARD_ERROR = "Failed to submit review.";
const CREATE_CARD_ERROR = "Failed to create card. Please try again.";

export const ERROR_MESSAGES = {
  "auth-missing": AUTH_MISSING_MSG,
  "auth-insufficient": AUTH_INSUFFICIENT_MSG,
  "required-username": INVALID_USERNAME_MSG,
  "required-password": REQUIRED_PASSWORD_MSG,
  "bad-password": BAD_PASSWORD_MSG,
  "username-already-exists": USERNAME_ALREADY_EXISTS,
  "user-not-registered": USER_NOT_REGISTERED,
  "network-error": NETWORK_ERROR,
  "required-front": REQUIRED_FRONT_MSG,
  "required-explain": REQUIRED_EXPLAIN_MSG,
  "card-not-found": CARD_NOT_FOUND,
  "load-card-error": LOAD_CARD_ERROR,
  "review-card-error": REVIEW_CARD_ERROR,
  "create-card-error": CREATE_CARD_ERROR,
};

export const getErrorMessage = (errorCode) => {
  return ERROR_MESSAGES[errorCode] || "An unexpected error occurred. Please try again.";
};