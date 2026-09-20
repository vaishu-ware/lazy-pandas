import { useEffect, useState } from "react";

import Login from "./pages/login";
import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";

import "./App.css";

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
 
  //login check
  useEffect(() => {
  const token = localStorage.getItem("token");

  if (token) {
    setIsLoggedIn(true);
  } else {
    setIsLoggedIn(false);
  }
}, []);

//logout function
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");

  setIsLoggedIn(false);
};

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show Welcome screen first
  if (showWelcome) {
    return <Welcome />;
  }

  // Show Home after successful login
  if (isLoggedIn) {
    return <Home onLogout={handleLogout} />;
  }

  // Show Register page
  if (showRegister) {
    return (
      <Register
        onLogin={() => setShowRegister(false)}
      />
    );
  }

  // Show Login page
  return (
    <Login
      onLogin={() => setIsLoggedIn(true)}
      onRegister={() => setShowRegister(true)}
    />
  );
}

export default App;