import { useEffect, useState, Fragment, useCallback } from "react";
import "./Home.css";
import socket from "../socket";


function Home({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatId, setChatId] = useState(null);
  const [unreadByChat, setUnreadByChat] = useState({});

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Group states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/message/unread/count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("Unread count error:", data.message);
        return;
      }

      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/message/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("Notifications error:", data.message);
        return;
      }

      setNotifications(data);

      const newUnreadByChat = {};
      data.forEach((n) => {
        newUnreadByChat[n.chat._id] = n.unreadCount;
      });
      setUnreadByChat(newUnreadByChat);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  const refreshCounts = useCallback(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, [fetchUnreadCount, fetchNotifications]);

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

      setSelectedUser(user);
      setSelectedGroup(null);
      setChatId(data._id);

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

      socket.emit("markMessagesRead", {
        chatId: data._id,
        userId: currentUserId,
      });

      setUnreadByChat((prev) => {
        const updated = { ...prev };
        delete updated[data._id];
        return updated;
      });

      refreshCounts();
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

      setSelectedGroup(group);
      setSelectedUser(null);
      setChatId(group._id);

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
        console.log("Failed to fetch group messages:", data.message);
        return;
      }

      console.log("Old group messages:", data);
      setMessages(data);

      const currentUserId = localStorage.getItem("userId");
      socket.emit("markMessagesRead", {
        chatId: group._id,
        userId: currentUserId,
      });

      setUnreadByChat((prev) => {
        const updated = { ...prev };
        delete updated[group._id];
        return updated;
      });

      refreshCounts();
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
  // SOCKET SETUP (personal room)
  // =========================

  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");
    if (currentUserId) {
      socket.emit("setup", currentUserId);
    }
  }, []);

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

      const currentUserId = localStorage.getItem("userId");
      const senderId =
        typeof newMessage.sender === "object"
          ? newMessage.sender._id
          : newMessage.sender;

      const messageChatId =
        typeof newMessage.chat === "object"
          ? newMessage.chat._id
          : newMessage.chat;

      if (messageChatId === chatId) {
        setMessages((previousMessages) => [
          ...previousMessages,
          newMessage,
        ]);

        if (senderId !== currentUserId) {
          socket.emit("markMessagesRead", {
            chatId: messageChatId,
            userId: currentUserId,
          });
        }
      }
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
  }, [chatId]);

  // =========================
  // REAL-TIME UNREAD COUNT UPDATES
  // =========================

  useEffect(() => {
    const handleUnreadCountUpdate = ({
      chatId: updatedChatId,
      chatUnreadCount,
      totalUnreadCount,
    }) => {
      setUnreadByChat((prev) => ({
        ...prev,
        [updatedChatId]: chatUnreadCount,
      }));
      setUnreadCount(totalUnreadCount);

      if (updatedChatId !== chatId) {
        fetchNotifications();
      }
    };

    socket.on(
      "unreadCountUpdate",
      handleUnreadCountUpdate
    );

    return () => {
      socket.off(
        "unreadCountUpdate",
        handleUnreadCountUpdate
      );
    };
  }, [chatId, fetchNotifications]);

  // =========================
  // REAL-TIME MESSAGES READ
  // =========================

  useEffect(() => {
    const handleMessagesRead = ({ chatId: readChatId }) => {
      setUnreadByChat((prev) => {
        const updated = { ...prev };
        delete updated[readChatId];
        return updated;
      });
      fetchUnreadCount();
      fetchNotifications();
    };

    socket.on(
      "messagesRead",
      handleMessagesRead
    );

    return () => {
      socket.off(
        "messagesRead",
        handleMessagesRead
      );
    };
  }, [fetchUnreadCount, fetchNotifications]);

  // =========================
  // INITIAL UNREAD COUNT & NOTIFICATIONS FETCH
  // =========================

  useEffect(() => {
    const init = async () => {
      await fetchUnreadCount();
      await fetchNotifications();
    };
    init();
  }, [fetchUnreadCount, fetchNotifications]);


  /* HANDLE NOTIFICATION CLICK */

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem("token");
      const currentUserId = localStorage.getItem("userId");
      const { chat } = notification;

      if (chat.isGroupChat) {
        setSelectedGroup(chat);
        setSelectedUser(null);
        setChatId(chat._id);
      } else {
        const chatUsers = chat.users || [];
        const otherUser = chatUsers.find(
          (u) => u._id !== currentUserId
        );
        if (otherUser) {
          setSelectedUser({
            _id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            pic: otherUser.pic,
          });
          setSelectedGroup(null);
          setChatId(chat._id);
        }
      }

      socket.emit("markMessagesRead", {
        chatId: chat._id,
        userId: currentUserId,
      });

      const messageResponse = await fetch(
        `http://localhost:5000/api/message/${chat._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const messageData = await messageResponse.json();
      if (messageResponse.ok) {
        setMessages(messageData);
      }

      setShowNotifications(false);

      setUnreadByChat((prev) => {
        const updated = { ...prev };
        delete updated[chat._id];
        return updated;
      });

      refreshCounts();
    } catch (error) {
      console.error("Failed to open chat from notification:", error);
    }
  };



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
  // HELPER: get unread count for a sidebar user
  // =========================

  const getUnreadForUser = (userId) => {
    const notification = notifications.find(
      (n) =>
        !n.chat.isGroupChat &&
        n.chat.users &&
        n.chat.users.some((u) => u._id === userId)
    );

    if (!notification) return 0;

    const chatId = notification.chat._id;
    return unreadByChat[chatId] !== undefined
      ? unreadByChat[chatId]
      : notification.unreadCount;
  };

  // =========================
  // HELPER: get unread count for a sidebar group
  // =========================

  const getUnreadForGroup = (groupId) => {
    return unreadByChat[groupId] !== undefined
      ? unreadByChat[groupId]
      : (notifications.find(
          (n) => n.chat._id === groupId
        )?.unreadCount || 0);
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
            users.map((user) => {
              const unread = getUnreadForUser(user._id);
              return (
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

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                      src={user.pic}
                      alt={user.name}
                    />

                    <div>
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                    </div>
                  </div>

                  {unread > 0 && (
                    <span className="sidebar-badge">
                      {unread}
                    </span>
                  )}

                </div>
              );
            })
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

            groups.map((group) => {
              const unread = getUnreadForGroup(group._id);
              return (
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

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

                  {unread > 0 && (
                    <span className="sidebar-badge">
                      {unread}
                    </span>
                  )}

                </div>
              );
            })

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

              {/* Notification Button */}
              <div className="notification-wrapper">
                <button
                  className="notification-btn"
                  onClick={() =>
                    setShowNotifications(
                      !showNotifications
                    )
                  }
                  title="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-count">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Popup */}
                {showNotifications && (
                  <div className="notification-popup">
                    <div className="notification-popup-header">
                      <h3>Notifications</h3>
                      <div className="notification-popup-header-actions">
                        <span className="notification-popup-count">
                          {notifications.length} unread
                        </span>
                        <button
                          className="notification-close"
                          onClick={() => setShowNotifications(false)}
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="notification-popup-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={
                              notification.chat._id
                            }
                            className="notification-item"
                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                          >
                            <div className="notification-avatar">
                              {notification.chat.isGroupChat ? (
                                "👥"
                              ) : (
                                <img
                                  src={
                                    notification.latestMessage.sender
                                      .pic
                                  }
                                  alt={
                                    notification.latestMessage.sender.name
                                  }
                                />
                              )}
                            </div>

                            <div className="notification-content">
                              <div className="notification-title">
                                {" "}
                                {notification.chat.isGroupChat
                                  ? notification.chat.chatName
                                  : notification.latestMessage.sender.name}
                                {" "}
                              </div>
                              <div className="notification-preview">
                                {
                                  notification.latestMessage.content
                                }
                              </div>
                              <div className="notification-time">
                                {new Date(
                                  notification.latestMessage.createdAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>

                            {notification.unreadCount > 0 && (
                              <span className="notification-count-inline">
                                {notification.unreadCount}
                              </span>
                            )}

                          </div>
                        ))
                      )}
                    </div>

                    <div className="notification-popup-footer">
                      <button
                        className="notification-view-all"
                        onClick={() => {
                          if (notifications.length > 0) {
                            handleNotificationClick(
                              notifications[0]
                            );
                          }
                        }}
                      >
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

                  /* Date separator logic */
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
