// --- Auth guard ---
const authToken = sessionStorage.getItem('auth-token');
const userName = sessionStorage.getItem('user-name') || 'Anonymous';
if (!authToken) {
  window.location.href = 'index.html';
}

// --- Socket connection ---
const socket = io({
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transportOptions: {
    polling: {
      extraHeaders: {
        Authorization: authToken,
        'x-user-name': encodeURIComponent(userName),
      },
    },
  },
});

const searchParams = new URLSearchParams(window.location.search);
const number = searchParams.get('roomId');
const roomName = searchParams.get('roomName');

const $messages = document.getElementById('messages');
const $sidebar = document.getElementById('sidebar');
const $messageForm = document.getElementById('messageForm');
const $messageInput = $messageForm.querySelector('input');

// Mustache templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

let historyLoaded = false;

// --- Render a single message ---
function renderMessage(msg) {
  if (typeof msg === 'string') {
    // System welcome string — skip, not needed in UI
    return;
  } else if (msg.isEvent) {
    const text = msg.messageText || msg.text || '';
    $messages.insertAdjacentHTML('beforeend',
      `<div class="text-center py-1.5"><span class="text-xs text-slate-500">${text}</span></div>`
    );
  } else {
    const name = msg.userName || msg.sender || 'Unknown';
    const text = msg.messageText || msg.text || '';
    const time = msg.timestamp
      ? moment(msg.timestamp).format('h:mm a')
      : moment().format('h:mm a');

    const html = Mustache.render(messageTemplate, {
      userName: name,
      message: text,
      createdAt: time,
    });
    $messages.insertAdjacentHTML('beforeend', html);
  }
  autoscroll();
}

// --- Load message history (runs ONCE) ---
async function loadHistory(roomId) {
  try {
    const response = await axios.get(`/api/chat/${roomId}/messages`, {
      headers: { Authorization: `BEARER ${authToken}` },
    });
    const messages = response.data;
    if (!messages || !messages.length) return;

    $messages.innerHTML = '';
    messages.reverse().forEach((msg) => {
      renderMessage({
        userName: msg.userName || msg.sender,
        messageText: msg.text,
        isEvent: msg.isEvent,
        timestamp: msg.timestamp,
      });
    });
  } catch (error) {
    console.error('Error fetching message history:', error);
  }
}

// --- Autoscroll ---
function autoscroll() {
  const $newMessage = $messages.lastElementChild;
  if (!$newMessage) return;
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom) || 0;
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  const visibleHeight = $messages.offsetHeight;
  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight;
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
}

// --- Wire up Leave Room button (inside Mustache-rendered sidebar) ---
function attachLeaveButton() {
  const btn = document.getElementById('leaveRoomBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      socket.disconnect();
      window.location.href = 'dashboard.html';
    });
  }
}

// --- Send message ---
$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = e.target.elements.message.value;
  if (!message.trim()) return;
  socket.emit('sendMessage', { roomName, message });
  $messageInput.value = '';
  $messageInput.focus();
});

// --- Socket events ---
socket.on('connect', async () => {
  console.log('Connected to server');

  // Load history FIRST (only once), THEN join room
  // This prevents the race condition where joinRoom event arrives
  // before history is loaded, and loadHistory wipes it with innerHTML = ''
  if (!historyLoaded) {
    await loadHistory(number);
    historyLoaded = true;
  }

  // Now join — join/leave events will append AFTER history
  socket.emit('joinRoom', { roomName });
});

socket.on('receiveMessage', (message) => {
  renderMessage(message);
});

socket.on('onlineUsers', ({ roomName, users }) => {
  const html = Mustache.render(sidebarTemplate, { roomName, users: users || [] });
  $sidebar.innerHTML = html;
  attachLeaveButton(); // Re-attach after Mustache re-renders sidebar
});

// --- Auth failure: redirect to login, stop reconnect loop ---
socket.on('authError', () => {
  socket.disconnect();
  sessionStorage.removeItem('auth-token');
  sessionStorage.removeItem('user-name');
  window.location.href = 'index.html';
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message);
});
