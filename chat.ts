import { v4 } from "https://deno.land/std/uuid/mod.ts";
import { isWebSocketCloseEvent } from "https://deno.land/std/ws/mod.ts";

// userID = {
//   userId: string,
//   name: string,
//   groupName: string,
//   ws: WebSocket
// }
const usersMap = new Map<String, Object>();

// groupName: [user 1, user2]
// { userId: string, name: string, groupName: string, ws: WebSocket}
const groupsMap = new Map<String, Object>();

// groupName : [message1, message2]
// { userId : string, name: string, message: string, time ? maybe}
const messagesMap = new Map();


export default async function chat (ws : any) {
  console.log('connected');
  const userId = v4.generate();

  for await (let data of ws) { //infinite async loop that waits for data
    console.log(data);
    const event = typeof data === 'string' ? JSON.parse(data) : data;

    //check if web socket closed
    if (isWebSocketCloseEvent(data)) {
      leaveGroup(userId);
      break;
    }
    var userObj : any;
    switch (event.event) {
      case 'join':
        userObj = {
          userId,
          name: event.name,
          groupName: event.groupName,
          ws
        };
        usersMap.set(userId, userObj);

        //group might have existing users, need to take care:
        const users: any = groupsMap.get(event.groupName) || []; //users is either an array of users or empty array
        users.push(userObj);
        groupsMap.set(event.groupName, users);

        //emit updated list of users to the client
        emitUserList(event.groupName);
        emitPreviousMessages(event.groupName, ws);
        break;
      
      case 'message':
        userObj = usersMap.get(userId);
        const message = {
          userId,
          name: userObj.name,
          message: event.data
        }
        const messages = messagesMap.get(userObj.groupName) || [];
        messages.push(message);
        messagesMap.set(userObj.groupName, messages);
        emitMessage(userObj.groupName, message, userId);
        break;
    }
  }

}

function emitPreviousMessages(groupName : any, ws : any) {
  const messages = messagesMap.get(groupName) || [];
  const event = {
    event: 'previousMessages',
    data: messages
  };
  ws.send(JSON.stringify(event));
}

function emitUserList(groupName : any) {
  const users : any = groupsMap.get(groupName) || [];
  for (const user of users) {
    const event = {
      event: 'users', //user update event
      data: getDisplayUsers(groupName)
    }
    user.ws.send(JSON.stringify(event))
  }
}

// remove unneeded data before emit to client
function getDisplayUsers(groupName : any) {
  const users : any = groupsMap.get(groupName) || [];
  return users.map((u : any) => {
    return ({ userId: u.userId, name: u.name });
  })
}

function emitMessage(groupName : any, message : any, senderId : any) {
  const users: any = groupsMap.get(groupName) || [];
  for (const user of users) {
    const tmpMessage = {
      ...message,
      sender : user.userId === senderId ? "me" : senderId
    }
    const event = {
      event: "message", //new message event
      data: tmpMessage,
    };
    user.ws.send(JSON.stringify(event));
  }
}

function leaveGroup(userId : any) {
  const userObj: any = usersMap.get(userId);
  var users: any = groupsMap.get(userObj.groupName) || [];
  users = users.filter((u: any) => u.userId !== userId);
  groupsMap.set(userObj.groupName, users);
  usersMap.delete(userId);
  emitUserList(userObj.groupName);
}