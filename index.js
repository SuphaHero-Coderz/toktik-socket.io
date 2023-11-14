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
  await subscriber.subscribe('backend_updates', (message) => {
    console.log(message); // 'message'
  });
})();

const axios = require("axios");

io.on("connection", (socket) => {
	const cookies = socket.request.headers.cookie
	console.log(cookies)
	function getCookie(cName) {
	   const name = cName + "=";
	   const cDecoded = decodeURIComponent(cookies);
	   const cArr = cDecoded.split(';');
	   let res;
	   cArr.forEach(val => {
		  if (val.indexOf(name) === 0) res = val.substring(name.length);
		  })
	   return res;
	}
	const access_token = getCookie("access_token")
  socket.on("view_video", (video_id) => {
	console.log(socket.handshake.headers.cookie)
	setInterval(async function() {
    try {
				console.log(video_id)
				axios.get(`http://backend:80/api/get_views/${video_id}`,
					{
						withCredentials: true,
						headers: {Cookie: `access_token=${access_token};`}
					}).then((response) => {
					io.emit("updated_views", response.data)
					console.log(response);
				});
			} catch (error) {
				console.log(error);
			}
	}, 5000);
	});
});


const PORT = process.env.PORT || 80;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
