const httpServer = require("http").createServer();
const redis = require("redis")

const io = require("socket.io")(httpServer, { cookie: true,
  cors: {
	   origin: "*",
	  credentials: true
  }
});

(async () => {
  const client = redis.createClient({
      socket: {
          host: "redis"
      }
  });
  const subscriber = client.duplicate();
  await subscriber.connect();
  subscriber.on('error', err => console.log('Redis Client Error', err));
  await subscriber.subscribe('backend_comments', (message) => {
    console.log(message); // 'message'
    io.emit("new comments", message)
  });
  await subscriber.subscribe('backend_videos', (message) => {
    console.log(message); // 'message'
    io.emit("new updates", message)
  });
})();

const axios = require("axios");

io.on("connection", (socket) => {
    console.log(socket.id)
});


const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
