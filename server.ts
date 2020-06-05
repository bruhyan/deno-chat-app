import { listenAndServe } from "https://deno.land/std/http/server.ts";
import {
  acceptWebSocket,
  acceptable
} from "https://deno.land/std/ws/mod.ts";
import chat from './chat.ts';

listenAndServe({ port: 8080 }, async req => {
  //check if request is websocket request, if it is accept
  if (acceptable(req)) {
    acceptWebSocket({
      conn: req.conn,
      bufReader: req.r,
      bufWriter: req.w,
      headers: req.headers
    }).then(chat);
  }
});

console.log('Server started on port 8080');