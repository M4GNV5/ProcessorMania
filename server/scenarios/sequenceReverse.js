function rand(max, min)
{
	max = max || 256;
	min = min || 1;
	max = max - min;

	return Math.round(Math.random() * 1000) % max + min;
}
function generateSequence()
{
	var len = rand(10, 5);
	var sequence = [];

	for(var i = 0; i < len; i++)
		sequence.push(rand());

	return sequence;
}

var completed = [];
var sequence = generateSequence();
expected = sequence.slice(0).reverse();

var cpu = {
	portToMem: rand(),
	outPort: rand(),

	tickRate: 5,
	memorySize: 0,
	modules: ["base", "conditional", "bcdreg", "alu"],
	displayRegs: ["ax", "dx", "ip"],
	out: function(port, val)
	{
		if(port == this.portToMem)
			mem.socket.sendJson({cmd: "IO", port: mem.portToCpu, value: val});

		else if(port == this.outPort)
		{
			var text;
			if(val == expected[0])
			{
				completed.push(expected.shift());

				text = completed.join(", ");
				if(expected.length == 0)
					text += " YOU WIN!";
			}
			else
			{
				text = "Error: expected " + expected[0] + ", got " + val;

				completed = [];
				sequence = generateSequence();
				expected = sequence.slice(0).reverse();
				console.dir(sequence);
				console.dir(expected);
			}

			cpu.socket.sendJson({cmd: "display", text: text});
			mem.socket.sendJson({cmd: "display", text: text});
		}
	}
};
var mem = {
	portToCpu: rand(),
	inPort: rand(),

	tickRate: 50,
	memorySize: 64,
	modules: ["base", "conditional", "loop"],
	displayRegs: ["ax", "cx", "ip"],
	setup: function()
	{
		this.in(this.inPort);
	},
	in: function(port)
	{
		if(port == this.inPort && sequence.length > 0)
			this.socket.sendJson({cmd: "IO", port: this.secPort, value: sequence.pop()});
	},
	out: function(port, val)
	{
		if(port == this.portToCpu)
			cpu.socket.sendJson({cmd: "IO", port: cpu.portToMem, value: val});
	}
};

module.exports = [
	cpu,
	mem
];
