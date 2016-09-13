if(process.argv.length < 3)
{
	console.error("Usage: " + process.argv[0] + " " + process.argv[1] + " <scenario>");
	process.exit(1);
}

var WebSocketServer = require("ws").Server;
var playerList = require("./scenarios/" + process.argv[2] + ".js");

var wss = new WebSocketServer({port: 8200});
wss.on("connection", function(socket)
{
	var playerId = -1;
	var player;
	for(var i = 0; i < playerList.length; i++)
	{
		if(!playerList[i].socket)
		{
			playerId = i;
			player = playerList[i];

			player.socket = socket;
			player.send({cmd: "start", info: player.info});
			player.emit("connect");

			break;
		}
	}
	if(playerId < 0)
	{
		socket.send(JSON.stringify({cmd: "full"}));
		socket.close();
		return;
	}

	var remoteAddress = socket.upgradeReq.connection.remoteAddress;
	console.log((new Date().toLocaleString()) + " | " + remoteAddress + " | connected as player " + playerId);

	socket.on("close", function()
	{
		console.log((new Date().toLocaleString()) + " | " + remoteAddress + " | disconnected as player " + playerId);
		player.socket = false;
		player.emit("disconnect");
	});
	socket.on("message", function(msg)
	{
		var data = JSON.parse(msg);
		switch(data.cmd)
		{
			case "out":
				player.emit("IOout", data.port, data.value);

				if(player.connectedPorts.indexOf(data.port) < 0)
					player.ioOut("Port not connected");
				break;
			case "in":
				player.emit("IOin", data.port);

				if(player.connectedPorts.indexOf(data.port) < 0)
					player.ioIn("Port not connected", 0);
				break;
			//...
		}
	});
});
