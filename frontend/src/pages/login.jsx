import { useState } from "react";

function Login({onLogin , onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(
      "http://localhost:5000/api/user/login",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email,
          password: password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
  alert(data.message);
  return;
}

//save login information in browser
localStorage.setItem("token", data.token);
localStorage.setItem("userId", data._id);

console.log("Login successful!");
console.log("Token saved!");

onLogin();

  } catch (error) {
    console.error("Login error:", error);
  }
};


  return (
    <div className="login-container">
      <div className="login-box">

        <h1>🐼 LazyPandas</h1>

        <p>Welcome back!</p>

        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit">
            Login
          </button>

        </form>

        <p className="register-text">
          Don't have an account?
          <span onClick={onRegister}>Register</span>
        </p>

      </div>
    </div>
  );
}

export default Login;