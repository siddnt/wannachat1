// --- Auth guard ---
if (!sessionStorage.getItem('auth-token')) {
  window.location.href = 'index.html';
}

const leaveBtn = document.querySelector(".leave-btn");
const createBtn = document.querySelector(".create-room");
const seeRoomBtn = document.querySelector(".see-room");
const roomList = document.getElementById("room-list");

// Show user greeting
const displayName = sessionStorage.getItem("user-name") || "User";
document.getElementById("user-greeting").textContent = `Hey, ${displayName}`;

leaveBtn.addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.removeItem("auth-token");
  sessionStorage.removeItem("user-name");
  window.location.href = "index.html";
});

createBtn.addEventListener("click", function () {
  const roomName = document.getElementById("message-input").value;
  if (roomName === "") {
    document.querySelector(".error-text").innerHTML =
      `<p>Room name is required!</p>`;
  } else {
    axios
      .post(
        "/api/chat",
        { name: roomName },
        {
          headers: {
            Authorization: `BEARER ${sessionStorage.getItem("auth-token")}`,
          },
        }
      )
      .then((response) => {
        document.querySelector(".error-text").innerHTML =
          `<p class="text-emerald-400">Room "${roomName}" created!</p>`;
        document.getElementById("message-input").value = "";
        seeRoomBtn.click();
      })
      .catch((error) => {
        document.querySelector(".error-text").innerHTML =
          `<p>${error.response?.data?.error || "Failed to create room"}</p>`;
      });
  }
});

seeRoomBtn.addEventListener("click", async () => {
  try {
    const response = await axios.get("/api/chat", {
      headers: {
        Authorization: `BEARER ${sessionStorage.getItem("auth-token")}`,
      },
    });
    const availableRooms = response.data;

    const roomListTitle = document.querySelector(".roomListTitle");
    if (!availableRooms.length) {
      roomListTitle.textContent = "No rooms available yet";
      roomListTitle.classList.remove("hidden");
      roomList.innerHTML = "";
    } else {
      roomListTitle.textContent = "Available Rooms";
      roomListTitle.classList.remove("hidden");
      roomList.innerHTML = "";

      availableRooms.forEach((room) => {
        const li = document.createElement("li");
        li.className =
          "bg-slate-900 border border-slate-800 rounded-xl px-5 py-3.5 cursor-pointer hover:bg-slate-800 hover:border-slate-700 transition-all duration-200 flex items-center justify-between group";
        li.innerHTML = `
          <span class="text-sm font-medium text-slate-200 group-hover:text-white">${room.name}</span>
          <span class="text-xs text-slate-600 group-hover:text-blue-400 transition">Join →</span>
        `;
        li.addEventListener("click", () => handleRoomClick(room));
        roomList.appendChild(li);
      });
    }
  } catch (error) {
    document.querySelector(".error-text").innerHTML =
      `<p>${error.response?.data?.error || "Failed to load rooms"}</p>`;
  }
});

const handleRoomClick = (room) => {
  window.location.href = `chat.html?roomId=${room._id}&roomName=${room.name}`;
};

// Auto-load rooms on page load
seeRoomBtn.click();
