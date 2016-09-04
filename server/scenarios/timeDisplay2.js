var ComPort = require("../comPort.js");

function randomPort()
{
	return Math.round(Math.random() * 1000) % 255 + 1;
}

var com = new ComPort(3000);

var cpu = {
	displayPort: randomPort(),

	tickRate: 5,
	memorySize: 256,
	modules: ["base", "conditional", "bit", "bcdreg", "alu", "stack"],
	displayRegs: ["ax", "ip"],
	setup()
	{
		com.master = this.socket;
	},
	in: function(port, val)
	{
		if(port == com.masterPort)
		{
			com.masterListen();
		}
		else
		{
			this.socket.sendJson({cmd: "IOin", error: "Port not connected"});
		}
	},
	out: function(port, val)
	{
		if(port == com.masterPort)
		{
			com.masterSend(val);
		}
		else if(port == this.displayPort)
		{
			var display = Math.min(99, val >> 8) + ":" + Math.min(99, val & 0xFF);
			cpu.socket.sendJson({cmd: "display", text: display});
			pit.socket.sendJson({cmd: "display", text: display});

			cpu.socket.sendJson({cmd: "IOout", error: false});
		}
		else
		{
			this.socket.sendJson({cmd: "IOout", error: "Port not connected"});
		}
	}
};
var pit = {
	secPort: randomPort(),
	milliPort: randomPort(),
	interruptPort: randomPort(),

	tickRate: 50,
	memorySize: 0,
	modules: ["base", "conditional", "bcdreg", "alu"],
	displayRegs: ["ax", "bx", "ip"],
	setup: function()
	{
		com.slave = this.socket;
	},
	in: function(port)
	{
		if(port == this.secPort)
		{
			var now = new Date();
			var val = ((now.getHours() % 12) * 60 + now.getMinutes()) * 60 + now.getSeconds();
			this.socket.sendJson({cmd: "IOin", error: false, port: this.secPort, value: val & 0xFFFF});
		}
		else if(port == this.milliPort)
		{
			this.socket.sendJson({cmd: "IOin", error: false, port: this.milliPort, value: Date.now() % 1000});
		}
		else if(port == com.slavePort)
		{
			com.slaveListen();
		}
		else
		{
			this.socket.sendJson({cmd: "IOin", error: "Port not connected"});
		}
	},
	out: function(port, val)
	{
		if(port == this.interruptPort)
		{
			cpu.socket.sendJson({cmd: "raise", id: val, text: "PIT interrupt"});
		}
		else if(port == com.slavePort)
		{
			com.slaveSend(val);
		}
		else
		{
			this.socket.sendJson({cmd: "IOout", error: "Port not connected"});
		}
	}
};

module.exports = [
	cpu,
	pit
];
