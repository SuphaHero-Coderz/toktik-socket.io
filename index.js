const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
  },
});

const axios = require("axios");

setInterval(async function() {
    await axios.get("http://localhost:8000/api/get_views").then(response => {
       io.emit("updated_views", response.data) 
    });
}, 5000);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
