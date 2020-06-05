let ws;
let chatUsersCtr = document.querySelector('#chatUsers');
let chatUsersCount = document.querySelector("#chatUsersCount");
let sendMessageForm = document.querySelector("#messageSendForm");
let messageInput = document.querySelector("#messageInput");
let chatMessagesCtr = document.querySelector("#chatMessages");
let leaveGroupBtn = document.querySelector("#leaveGroupBtn");
let groupName = document.querySelector("#groupName");

window.addEventListener('DOMContentLoaded', () => {
  ws = new WebSocket('wss://proud-morning-6247.fly.dev/ws');
  ws.addEventListener('open', onConnectionOpen);
  ws.addEventListener('message', onMessageReceived);

  const queryParams = getQueryParams();
  console.log(queryParams);
});

sendMessageForm.onsubmit = (ev) => {
  console.log('form submit');
  ev.preventDefault();
  if (!messageInput.value) {
    return;
  }
  const event = {
    event: 'message',
    data: messageInput.value
  }
  ws.send(JSON.stringify(event));
  messageInput.value = '';
}

leaveGroupBtn.onclick = () => {
  const event = {
    event: 'leave',
  };
  ws.send(JSON.stringify(event));
  window.location.href = 'chat.html';
}

function onConnectionOpen () {
  console.log('Connection Opened');
  
  const queryParams = getQueryParams();
  console.log(queryParams);
  if (!queryParams.name || !queryParams.group) {
    window.location.href = 'chat.html';
  }
  groupName.innerHTML = queryParams.group;
  const event = {
    event: 'join',
    groupName: queryParams.group,
    name: queryParams.name
  }
  ws.send(JSON.stringify(event));
}

function onMessageReceived (event) {
  console.log('Message Received', event.data);
  event = JSON.parse(event.data);
  switch (event.event) {
    case 'users':
      chatUsersCtr.innerHTML = '';
      chatUsersCount.innerHTML = event.data.length;
      event.data.forEach(u => {
        const userEl = document.createElement('div');
        userEl.className = 'chat-user';
        userEl.innerHTML = u.name;
        chatUsersCtr?.appendChild(userEl);
      })
      break;
    case 'message':
      const el = chatMessagesCtr;
      const toScrollToBtm = Math.floor(el.offsetHeight + el.scrollTop) === el.scrollHeight;
      appendMessage(event.data);
      if (toScrollToBtm) {
        el.scrollTop = 1000000;
      }
      break;
    case 'previousMessages':
      event.data.forEach(appendMessage);
  }
}

function appendMessage (message) {
  const messageEl = document.createElement("div");
  messageEl.className = `message message-${
    message.sender === "me" ? "to" : "from"
  }`;
  messageEl.innerHTML = `
    ${message.sender === "me" ? "" : `<h4>${message.name}</h4>`}
    <p class="message-text">${message.message}</p>
  `;
chatMessagesCtr?.appendChild(messageEl);
}

function getQueryParams () {
  // do some string manipulation to get params out of query
  const search = window.location.search.substring(1);
  const pairs = search.split('&');
  const params = {};
  for (const pair of pairs) {
    const parts = pair.split('=');
    params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return params;
}