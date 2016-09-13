var Player = require("../player.js");
var ComPort = require("../comPort.js");

function randomPort()
{
	return Math.round(Math.random() * 1000) % 255 + 1;
}

var displayPort = randomPort();
var secPort = randomPort();
var milliPort = randomPort();
var interruptPort = randomPort();

var cpu = new Player();
cpu.outPorts.push(displayPort);
cpu.info = {
	tickRate: 5,
	memorySize: 256,
	modules: ["base", "conditional", "bit", "bcdreg", "alu", "stack"],
	displayRegs: ["ax", "ip"]
};
cpu.on("IOout", function(port, val)
{
	if(port == displayPort)
	{
		var display = (val >> 8) + ":" + (val & 0xFF);
		cpu.setOutput(display);
		pit.setOutput(display);
		cpu.ioOut(false);
	}
});

var pit = new Player();
pit.inPorts.push(secPort, milliPort);
pit.outPorts.push(interruptPort);
pit.info = {
	tickRate: 50,
	memorySize: 0,
	modules: ["base", "conditional", "bcdreg", "alu"],
	displayRegs: ["ax", "bx", "ip"]
};
pit.on("IOin", function(port)
{
	if(port == secPort)
	{
		var now = new Date();
		var val = ((now.getHours() % 12) * 60 + now.getMinutes()) * 60 + now.getSeconds();
		pit.ioIn(false, val);
	}
	else if(port == milliPort)
	{
		pit.ioIn(false, Date.now() % 1000);
	}
});
pit.on("IOout", function(port, val)
{
	if(port == interruptPort)
		cpu.raise(val, "PIT interrupt");
});

var com = new ComPort(3000, cpu, pit);

module.exports = [
	cpu,
	pit
];
