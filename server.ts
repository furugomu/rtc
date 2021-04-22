import express from "express";
import { createServer } from "http";
import createSocketServer from "./src/socketio";

const app = express();
app.use(express.static("public"));
const server = createServer(app);
createSocketServer(server);
const port = Number(process.env.PORT || 9999);
server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});
