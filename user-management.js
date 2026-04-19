const registeredUsers = new Set();
registeredUsers.add("dog");

function isValidUsername(username) {
  let isValid = true;
  isValid = isValid && username.trim();
  isValid = isValid && username.match(/^[A-Za-z0-9_]+$/);
  return isValid;
}

function isUserRegistered(username) {
  return registeredUsers.has(username);
}

function registerUser(username) {
  if (registeredUsers.has(username)) {
    return false;
  }
  registeredUsers.add(username);
  return true;
}

export default {
  isValidUsername,
  isUserRegistered,
  registerUser,
};