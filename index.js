const httpServer = require("http").createServer();
const redis = require("redis")

const io = require("socket.io")(httpServer, {
	cookie: true,
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

	await subscriber.subscribe('new_notification', (message) => {
		console.log(message);
		const parsed = JSON.parse(message);
		var video_owner_id = parsed[0].video_owner_id;
		io.to(video_owner_id).emit("new_notification", JSON.stringify(parsed.slice(1)));
	})
})();

const axios = require("axios");


// Middleware that checks username and allows the connection
io.use((socket, next) => {
	const user_id = socket.handshake.auth.user_id;
	if (!user_id) {
		return next(new Error("Invalid user_id"));
	}
	socket.user_id = user_id;
	next();
});


io.on("connection", (socket) => {
	socket.join(socket.user_id);

	socket.on("join_vip", () => {
		
	});
});


const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () =>
	console.log(`server listening at http://localhost:${PORT}`)
);
