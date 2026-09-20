import { useState } from "react";
import "./Register.css";

function Register({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const avatarOptions = [
    "https://api.dicebear.com/10.x/adventurer/svg?seed=Alex",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=Emma",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=Rahul",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=brainv",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=Leon",
    "https://api.dicebear.com/10.x/big-smile/svg?seed=doraamon",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=Arjun",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=Prachin",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=Samo",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=ma",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=ri",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=vaishnavi",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=may",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=march",
    "https://api.dicebear.com/10.x/big-smile/svg?seed=Sano",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=gho",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=Adii",
    "https://api.dicebear.com/10.x/adventurer/svg?seed=merr",
  ];

  const [selectedAvatar, setSelectedAvatar] = useState(
    avatarOptions[0]
  );

  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/user/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            pic: selectedAvatar,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      console.log("Registration successful!");
      console.log("New user:", data);

      alert("Registration successful! Please login.");

      onLogin();
    } catch (error) {
      console.error("Registration error:", error);

      alert("Registration error: " + error.message);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">

        <h1>🐼 LazyPandas</h1>

        <p className="welcome-text">
          Create your account
        </p>

        <form onSubmit={handleRegister}>

          {/* Name */}
          <div className="form-group">
            <label>Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Profile Picture */}
          <div className="profile-picture-section">

            <h3>Choose Profile Picture</h3>

            <div
              className="selected-avatar"
              onClick={() => setShowAvatarModal(true)}
            >
              <img
                src={selectedAvatar}
                alt="Selected avatar"
              />

              <p>Choose Avatar</p>
            </div>

          </div>

          {/* Avatar Modal */}
          {showAvatarModal && (
            <div className="avatar-modal-overlay">

              <div className="avatar-modal">

                <div className="avatar-modal-header">
                  <h2>Choose Your Avatar</h2>

                  <button
                    type="button"
                    className="close-modal-button"
                    onClick={() => setShowAvatarModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <p className="avatar-description">
                  Pick a character that represents you!
                </p>

                <div className="avatar-grid">

                  {avatarOptions.map((avatar, index) => (
                    <div
                      key={index}
                      className={
                        selectedAvatar === avatar
                          ? "avatar-option selected"
                          : "avatar-option"
                      }
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                      />

                      {selectedAvatar === avatar && (
                        <div className="avatar-check">
                          ✓
                        </div>
                      )}
                    </div>
                  ))}

                </div>

                <button
                  type="button"
                  className="use-avatar-button"
                  onClick={() => setShowAvatarModal(false)}
                >
                  Use This Avatar
                </button>

              </div>
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            className="register-button"
          >
            Register
          </button>

        </form>

        {/* Login */}
        <p className="login-link">
          Already have an account?{" "}
          <span onClick={onLogin}>
            Login
          </span>
        </p>

      </div>
    </div>
  );
}

export default Register;
