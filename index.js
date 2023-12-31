const httpServer = require("http").createServer();
const redis = require("redis")
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");


const io = require("socket.io")(httpServer, {
	cookie: true,
	cors: {
        origin: "http://localhost"
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
		const video_owner_id = parsed[0].video_owner_id;
		var subscribers = parsed[0].subscribers;
		subscribers = subscribers ? subscribers : [];

		console.log("There has been a new notification");

		io.to(video_owner_id).emit("new_notification", JSON.stringify(parsed.slice(1)));

		for (var i = 0; i < subscribers.length; i++) {
			console.log(`Notifying user ${subscribers[i]}`);
			io.to(subscribers[i]).emit("new_notification", JSON.stringify(parsed.slice(1)))
		}
	})
})();



// Middleware that checks username and allows the connection
io.use((socket, next) => {
	const user_id = socket.handshake.auth.user_id;
	const subscriptions = socket.handshake.auth.subscriptions;

	console.log(socket.handshake.auth);

	if (!user_id) {
		return next(new Error("Invalid user_id"));
	}
	socket.user_id = user_id;
	socket.subscriptions = subscriptions ? subscriptions : [];
	next();
});


io.on("connection", (socket) => {
	socket.join(socket.user_id);
	console.log(`Joining user room: ${socket.user_id}`)
    socket.on('error', function (err) {
        if (err.description) throw err.description;
        else throw err; // Or whatever you want to do
    });
});


const PORT = process.env.PORT || 3001;


httpServer.listen(PORT, () =>
	console.log(`server listening at http://localhost:${PORT}`)
);
