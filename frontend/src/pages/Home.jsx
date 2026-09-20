import { useEffect, useState, Fragment } from "react";
import "./Home.css";
import socket from "../socket";


const formatMessageTime = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateSeparator = (date) => {
  if (!date) return "";

  const messageDate = new Date(date);
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  if (isSameDay(messageDate, today)) {
    return "Today";
  }

  if (isSameDay(messageDate, yesterday)) {
    return "Yesterday";
  }

  // For older messages
  return messageDate.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
function Home({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatId, setChatId] = useState(null);

  // Group states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);

  // =========================
  // SELECT USER
  // =========================

  const handleSelectUser = async (user) => {
    try {
      const currentUserId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!currentUserId) {
        console.log("Current user ID is missing");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentUserId: currentUserId,
            userId: user._id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("Chat error:", data.message);
        return;
      }

      console.log("Chat created/found:", data);

      // Select user
      setSelectedUser(user);

      // Clear selected group
      setSelectedGroup(null);

      // Save chat ID
      setChatId(data._id);

      // Get old messages
      const messageResponse = await fetch(
        `http://localhost:5000/api/message/${data._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const messageData = await messageResponse.json();

      if (!messageResponse.ok) {
        console.log("Message error:", messageData.message);
        return;
      }

      console.log("Old messages:", messageData);

      setMessages(messageData);

      await fetch(`http://localhost:5000/api/message/read/${data._id}`,        //mark messgae as read
        {
          method: "PUT",

          headers: {
            Authentication: `Bearer ${token}`,
          },
        }
      );

      const unreadResponse = await fetch(
        "http://localhost:5000/api/message/unread/count",
        {
          headers: {
            Authentication: `Bearer ${token}`,
          },
        }
      );
      const unreadData = await unreadResponse.json();

      setUnreadCount(unreadData.unreadCount || 0);


    } catch (error) {
      console.error("Failed to open chat:", error);
    }
  };

  // =========================
  // SELECT GROUP
  // =========================

  const handleSelectGroup = async (group) => {
    try {
      const token = localStorage.getItem("token");

      console.log("Selected group:", group);

      // Select group
      setSelectedGroup(group);

      // Clear selected user
      setSelectedUser(null);

      // Set group chat ID
      setChatId(group._id);

      // Fetch old messages
      const response = await fetch(
        `http://localhost:5000/api/message/${group._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(
          "Failed to fetch group messages:",
          data.message
        );
        return;
      }

      console.log("Old group messages:", data);

      setMessages(data);
    } catch (error) {
      console.error("Error opening group:", error);
    }
  };

  // =========================
  // JOIN CHAT ROOM
  // =========================

  useEffect(() => {
    if (!chatId) {
      return;
    }

    socket.emit("joinChat", chatId);

    console.log("Joined chat:", chatId);
  }, [chatId]);

  // =========================
  // FETCH USERS
  // =========================

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/user",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.log("Error:", data.message);
          return;
        }

        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, []);

  // =========================
  // FETCH GROUPS
  // =========================

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/chat/groups",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.log(
            "Failed to fetch groups:",
            data.message
          );
          return;
        }

        console.log("Groups fetched:", data);

        setGroups(data);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();
  }, []);

  // =========================
  // SEND MESSAGE
  // =========================

  const handleSend = () => {
    if (!message.trim()) {
      return;
    }

    if (!chatId) {
      console.log("Chat ID is missing");
      return;
    }

    const messageData = {
      sender: localStorage.getItem("userId"),
      content: message,
      chat: chatId,
    };

    console.log("Sending message:", messageData);

    socket.emit("sendMessage", messageData);

    setMessage("");
  };

  // =========================
  // RECEIVE MESSAGES
  // =========================

  useEffect(() => {
    const handleMessageReceived = (newMessage) => {
      console.log("Message received:", newMessage);

      setMessages((previousMessages) => [
        ...previousMessages,
        newMessage,
      ]);
    };

    socket.on(
      "messageReceived",
      handleMessageReceived
    );

    return () => {
      socket.off(
        "messageReceived",
        handleMessageReceived
      );
    };
  }, []);

  /* FETCH UNREAD COUNT */

  useEffect(() => {

    const fetchUnreadCount = async () => {

      try {

        const token =
          localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/message/unread/count",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );


        const data =
          await response.json();


        if (!response.ok) {

          console.log(
            "Unread count error:",
            data.message
          );

          return;
        }


        setUnreadCount(
          data.unreadCount || 0
        );


      } catch (error) {

        console.error(
          "Failed to fetch unread count:",
          error
        );

      }

    };


    fetchUnreadCount();

  }, []);



  /*CREATE GROUP */


  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (selectedGroupUsers.length < 2) {
      alert("Please select at least 2 users");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/chat/group",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: groupName,
            users: selectedGroupUsers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(
          "Group creation error:",
          data.message
        );

        alert(data.message);
        return;
      }

      console.log(
        "Group created successfully:",
        data
      );

      alert("Group created successfully!");

      setGroups((previousGroups) => [
        ...previousGroups,
        data,
      ]);

      setShowGroupModal(false);

      setGroupName("");
      setSelectedGroupUsers([]);
    } catch (error) {
      console.error(
        "Failed to create group:",
        error
      );
    }
  };

  // =========================
  // JSX
  // =========================

  return (
    <div className="chat-container">

      {/* =========================
          LEFT SIDEBAR
      ========================= */}

      <div className="sidebar">

        {/* Sidebar Header */}

        <div className="sidebar-header">

          <h2>🐼 LazyPandas</h2>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>


        {/* =========================
            USERS
        ========================= */}

        <div className="users-list">

          {users.length === 0 ? (
            <p className="no-users">
              No other users found.
            </p>
          ) : (
            users.map((user) => (

              <div
                key={user._id}

                className={
                  selectedUser?._id === user._id
                    ? "user-item selected"
                    : "user-item"
                }

                onClick={() =>
                  handleSelectUser(user)
                }
              >

                <img
                  src={user.pic}
                  alt={user.name}
                />

                <div>
                  <h3>{user.name}</h3>

                  <p>{user.email}</p>
                </div>

              </div>

            ))
          )}

        </div>


        {/* =========================
            CREATE GROUP BUTTON
        ========================= */}

        <button
          className="create-group-button"
          onClick={() =>
            setShowGroupModal(true)
          }
        >
          + Create Group
        </button>


        {/* =========================
            GROUP MODAL
        ========================= */}

        {showGroupModal && (

          <div className="group-modal-overlay">

            <div className="group-modal">

              <h2>Create New Group</h2>

              {/* Group name */}

              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) =>
                  setGroupName(e.target.value)
                }
              />


              <h3>Select Users</h3>


              {/* Users */}

              <div className="group-users-list">

                {users.map((user) => (

                  <label
                    key={user._id}
                    className="group-user"
                  >

                    <input
                      type="checkbox"
                      checked={selectedGroupUsers.includes(
                        user._id
                      )}

                      onChange={(e) => {

                        if (e.target.checked) {

                          setSelectedGroupUsers(
                            (previous) => [
                              ...previous,
                              user._id,
                            ]
                          );

                        } else {

                          setSelectedGroupUsers(
                            (previous) =>
                              previous.filter(
                                (id) =>
                                  id !== user._id
                              )
                          );

                        }

                      }}
                    />

                    <img
                      src={user.pic}
                      alt={user.name}
                    />

                    <span>
                      {user.name}
                    </span>

                  </label>

                ))}

              </div>


              {/* Modal Buttons */}

              <div className="group-modal-buttons">

                <button
                  type="button"
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName("");
                    setSelectedGroupUsers([]);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateGroup}
                >
                  Create Group
                </button>

              </div>

            </div>

          </div>

        )}


        {/* =========================
            GROUPS
        ========================= */}

        <div className="groups-section">

          <h3 className="groups-title">
            Groups
          </h3>

          {groups.length === 0 ? (

            <p className="no-groups">
              No groups created yet.
            </p>

          ) : (

            groups.map((group) => (

              <div
                key={group._id}

                className={
                  selectedGroup?._id === group._id
                    ? "group-item selected"
                    : "group-item"
                }

                onClick={() =>
                  handleSelectGroup(group)
                }
              >

                <div className="group-icon">
                  👥
                </div>

                <div>

                  <h3>
                    {group.chatName}
                  </h3>

                  <p>
                    {group.users.length} members
                  </p>

                </div>

              </div>

            ))

          )}

        </div>

      </div>


      {/* =========================
          RIGHT CHAT AREA
      ========================= */}

      <div className="chat-area">

        {!selectedUser && !selectedGroup ? (

          <div className="welcome-chat">

            <div className="big-panda">
              🐼
            </div>

            <h1>
              Welcome to LazyPandas
            </h1>

            <p>
              Select a user or group to start chatting.
            </p>

          </div>

        ) : (

          <div className="selected-chat">

            {/* Chat Header */}

            <div className="chat-header">

              {selectedGroup ? (

                <>
                  <div className="group-header-icon">
                    👥
                  </div>

                  <div>

                    <h2>
                      {selectedGroup.chatName}
                    </h2>

                    <p>
                      {selectedGroup.users.length} members
                    </p>

                  </div>
                </>

              ) : (

                <>
                  <img
                    src={selectedUser.pic}
                    alt={selectedUser.name}
                  />

                  <div>

                    <h2> {selectedUser.name}</h2>
                    <p>{selectedUser.email} </p>
                  </div>
                </>

              )}

              {/* Notification Button  */}
              <button
                className="notification-btn"
                onClick={() => {
                  console.log("Unread messages:",
                    unreadCount
                  );
                }}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="nofication-count">{unreadCount}</span>
                )}
              </button>
            </div>

            {/* =========================
                MESSAGES
            ========================= */}

            <div className="messages-area">

              {messages.length === 0 ? (

                <p>
                  💬 Your conversation will appear here.
                </p>

              ) : (

                messages.map((msg, index) => {

                  const currentUserId =
                    localStorage.getItem("userId");

                  const senderId =
                    typeof msg.sender === "object"
                      ? msg.sender._id
                      : msg.sender;

                  const isMyMessage =
                    senderId === currentUserId;

                  /* Date seprator logic */
                  const currentMessageDate =
                    new Date(msg.createdAt);

                  const previousMessageDate =
                    index > 0
                      ? new Date(messages[index - 1].createdAt)
                      : null;


                  const isDifferentDay =
                    !previousMessageDate ||
                    currentMessageDate.toDateString() !==
                    previousMessageDate.toDateString();

                  /* DATE TEXT*/
                  const today = new Date();
                  const yesterday = new Date();
                  yesterday.setDate(today.getDate() - 1);


                  let dateText;


                  if (
                    currentMessageDate.toDateString() ===
                    today.toDateString()
                  ) {

                    dateText = "Today";

                  } else if (
                    currentMessageDate.toDateString() ===
                    yesterday.toDateString()
                  ) {

                    dateText = "Yesterday";

                  } else {

                    dateText =
                      currentMessageDate.toLocaleDateString(
                        [],
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      );

                  }

                  return (
                    <Fragment key={msg._id}>

                      {/* DATE SEPARATOR */}

                      {isDifferentDay && (
                        <div className="date-separator">
                          <span>
                            {dateText}
                          </span>

                        </div>
                      )}

                      {/* MESSAGE */}

                      <div
                        className={
                          isMyMessage
                            ? "message-row my-message-row"
                            : "message-row their-message-row"
                        }
                      >

                        <div
                          className={
                            isMyMessage
                              ? "message-bubble my-message"
                              : "message-bubble their-message"
                          }
                        >

                          {/* GROUP SENDER NAME */}
                          {selectedGroup &&
                            !isMyMessage && (

                              <div className="message-sender-name">

                                {typeof msg.sender === "object"
                                  ? msg.sender.name
                                  : "User"}

                              </div>

                            )}


                          {/* MESSAGE TEXT */}

                          <div className="message-text">
                            {msg.content}
                          </div>


                          {/* MESSAGE TIME */}
                          <div className="message-time">

                            {new Date(
                              msg.createdAt
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}

                          </div>
                        </div>

                      </div>

                    </Fragment>
                  );

                })

              )}

            </div>

            {/* =========================
                MESSAGE INPUT
            ========================= */}

            <div className="message-input">

              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }

                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
              />

              <button onClick={handleSend}>
                Send
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default Home;
