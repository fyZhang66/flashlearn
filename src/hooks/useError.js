import { useState } from "react";
import { getErrorMessage } from "../utils/errors";

function useError() {
  const [errorMessage, setErrorMessage] = useState("");

  const setError = (error) => {
    if (typeof error === "string") {
      if (error === "auth-missing") return;
      setErrorMessage(getErrorMessage(error));
    } else if (error?.error) {
      if (error.error === "auth-missing") return;
      setErrorMessage(getErrorMessage(error.error));
    } else {
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  const clearError = () => {
    setErrorMessage("");
  };

  return { errorMessage, setError, clearError };
}

export default useError;
