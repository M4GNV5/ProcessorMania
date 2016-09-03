module.exports = [
	{
		tickRate: 100,
		memorySize: 256,
		modules: ["base", "loop", "conditional", "bit", "bcdreg", "alu", "stack"],
		displayRegs: ["ax", "cx", "ip"],
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
