if(process.argv.length < 3)
{
	console.error("Usage: " + process.argv[0] + " " + process.argv[1] + " <scenario>");
	process.exit(1);
}

var WebSocketServer = require("ws").Server;
var player = require("./scenarios/" + process.argv[2] + ".js");

var wss = new WebSocketServer({port: 8200});
wss.on("connection", function(socket)
{
	socket.sendJson = function(obj)
	{
		socket.send(JSON.stringify(obj));
	};

	var playerId = -1;
	for(var i = 0; i < player.length; i++)
	{
		if(!player[i].socket)
		{
			playerId = i;
			player[i].socket = socket;
			socket.sendJson({
				cmd: "start",
				tickRate: player[i].tickRate,
				memorySize: player[i].memorySize,
				modules: player[i].modules,
				displayRegs: player[i].displayRegs
			});

			if(player[i].setup)
				player[i].setup();

			break;
		}
	}
	if(playerId < 0)
	{
		socket.sendJson({cmd: "full"});
		socket.close();
		return;
	}

	var remoteAddress = socket.upgradeReq.connection.remoteAddress;
	console.log((new Date().toLocaleString()) + " | " + remoteAddress + " | connected as player " + playerId);

	socket.on("close", function()
	{
		console.log((new Date().toLocaleString()) + " | " + remoteAddress + " | disconnected as player " + playerId);
		player[playerId].socket = false;
	});
	socket.on("message", function(msg)
	{
		var data = JSON.parse(msg);
		switch(data.cmd)
		{
			case "out":
				if(player[playerId].out)
					player[playerId].out(data.port, data.value);
				break;
			case "in":
				if(player[playerId].in)
					player[playerId].in(data.port);
				break;
			//...
		}
	});
});
