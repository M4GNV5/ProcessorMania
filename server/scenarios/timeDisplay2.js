function randomPort()
{
	return Math.round(Math.random() * 1000) % 255 + 1;
}

var cpu = {
	portToPit: randomPort(),
	displayPort: randomPort(),

	tickRate: 5,
	memorySize: 256,
	modules: ["base", "conditional", "bit", "bcdreg", "alu", "stack"],
	mainReg: ["ax", "ip"],
	out: function(port, val)
	{
		if(port == this.portToPit)
			pit.socket.sendJson({cmd: "IO", port: pit.portToCpu, value: val});

		else if(port == this.displayPort)
		{
			var display = Math.min(99, val >> 8) + ":" + Math.min(99, val & 0xFF);
			cpu.socket.sendJson({cmd: "display", text: display});
			pit.socket.sendJson({cmd: "display", text: display});
		}
	}
};
var pit = {
	portToCpu: randomPort(),
	secPort: randomPort(),
	milliPort: randomPort(),

	tickRate: 50,
	memorySize: 0,
	modules: ["base", "conditional", "bcdreg", "alu"],
	mainReg: ["ax", "bx", "ip"],
	setup: function()
	{
		this.in(this.secPort);
		this.in(this.milliPort);
	},
	in: function(port)
	{
		if(port == this.secPort)
		{
			var now = new Date();
			var val = ((now.getHours() % 12) * 60 + now.getMinutes()) * 60 + now.getSeconds();
			this.socket.sendJson({cmd: "IO", port: this.secPort, value: val & 0xFFFF});
		}

		if(port == this.milliPort)
			this.socket.sendJson({cmd: "IO", port: this.milliPort, value: Date.now() % 1000});
	},
	out: function(port, val)
	{
		if(port == this.portToCpu)
			cpu.socket.sendJson({cmd: "raise", id: val, text: "PIT interrupt"});
	}
};

module.exports = [
	cpu,
	pit
];
