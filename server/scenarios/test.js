var Player = require("../player.js");

var p = new Player();
p.info = {
	tickRate: 5,
	memorySize: 256,
	modules: ["base", "loop", "conditional", "bit", "bcdreg", "alu", "stack"],
	displayRegs: ["ax", "cx", "ip"]
};

p.on("IOin", function(port)
{
	console.log((new Date().toLocaleString()) + " | in " + port);
});
p.on("IOout", function(port, val)
{
	console.log((new Date().toLocaleString()) + " | out " + port + ", " + val);
});

module.exports = [p];
