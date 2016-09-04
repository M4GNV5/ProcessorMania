module.exports = [
	{
		tickRate: 100,
		memorySize: 256,
		modules: ["base", "loop", "conditional", "bit", "bcdreg", "alu", "stack"],
		displayRegs: ["ax", "cx", "ip"],
		in: function(port)
		{
			this.socket.sendJson({
				cmd: "IOin",
				error: false,
				port: port,
				value: port
			});
			console.log((new Date().toLocaleString()) + " | inb " + port);
		},
		out: function(port, val)
		{
			this.socket.sendJson({
				cmd: "IOout",
				error: false
			});
			console.log((new Date().toLocaleString()) + " | outb " + port + " " + val);
		}
	}
];
