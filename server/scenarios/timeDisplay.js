function randomPort()
{
	return Math.round(Math.random() * 1000) % 255 + 1;
}

var cpu = {
	portToPit: randomPort(),
	portToDisplay: randomPort(),

	tickRate: 10,
	memorySize: 256,
	modules: ["base", "conditional", "bit", "bcdreg", "alu", "stack"],
	mainReg: "ax",
	out: function(port, val)
	{
		if(port == this.portToPit)
			pit.socket.sendJson({cmd: "IO", port: pit.portToCpu, value: val});
		else if(port == this.portToDisplay)
			display.socket.sendJson({cmd: "IO", port: display.portToCpu, value: val});
	}
};
var pit = {
	portToCpu: randomPort(),
	timePort: randomPort(),

	tickRate: 50,
	memorySize: 0,
	modules: ["base", "conditional", "bcdreg", "alu"],
	mainReg: "ax",
	setup: function()
	{
		this.socket.sendJson({cmd: "IO", port: this.timePort, value: Date.now() & 0xFFFF});
	},
	in: function(port)
	{
		if(port == this.timePort)
			this.socket.sendJson({cmd: "IO", port: this.timePort, value: Date.now() & 0xFFFF});
	},
	out: function(port, val)
	{
		if(port == this.portToCpu)
			cpu.socket.sendJson({cmd: "raise", id: val, text: "PIT interrupt"});
	}
};
var display = {
	portToCpu: randomPort(),
	upperValPort: randomPort(),
	lowerValPort: randomPort(),
	text: "00:00",

	tickRate: 50,
	memorySize: 16,
	modules: ["base", "conditional", "bcdreg", "alu"],
	mainReg: "ax",
	out: function(port, val)
	{
		if(port == this.portToCpu)
			cpu.socket.sendJson({cmd: "IO", port: cpu.portToDisplay, value: val});

		if(val > 99)
			val = 99;

		var text = this.text;
		if(port == this.upperValPort)
			text = val.toString() + text.substr(2);
		if(port == this.lowerValPort)
			text = text.substr(0, 3) + val.toString();

		if(text != this.text)
		{
			var pkg = {
				cmd: "display",
				text: text
			};

			cpu.socket.sendJson(pkg);
			pit.socket.sendJson(pkg);
			display.socket.sendJson(pkg);

			this.text = text;
		}
	}
};

module.exports = [
	cpu,
	pit,
	display
];
