module.exports = [
	{
		tickRate: 1000,
		memorySize: 256,
		modules: ["base", "conditional", "bit", "bcdreg", "alu", "stack"],
		mainReg: "ax",
		in: function(port)
		{
			this.socket.sendJson({
				cmd: "display",
				text: "You issued inb on port " + port
			});
			console.log((new Date().toLocaleString()) + " | inb " + port);
		},
		out: function(port, val)
		{
			console.log((new Date().toLocaleString()) + " | outb " + port + " " + val);
		}
	}
];
