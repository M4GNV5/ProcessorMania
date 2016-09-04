var ComPort = require("../comPort.js");

function rand(max, min)
{
	max = max || 256;
	min = min || 1;
	max = max - min;

	return Math.round(Math.random() * 1000) % max + min;
}

var mode = process.argv[4] || "print";
var completed;
var sequence;
var expected;
function generateSequence()
{
	var len = rand(10, 5);
	completed = [];
	sequence = [];

	for(var i = 0; i < len; i++)
		sequence.push(rand());

	switch(process.argv[3])
	{
		case "reverse":
			expected = sequence.slice(0).reverse();
			break;
		case "average":
			expected = 0;
			for(var i = 0; i < sequence.length; i++)
				expected += sequence[i];

			expected = [Math.floor(expected / sequence.length)];
			break;
		case "sort":
			expected = sequence.slice(0).sort(function(a, b)
			{
				return a - b;
			});
			break;
		case "clamp":
			var min = rand(100, 0);
			var max = rand(255, 150);

			expected = [];
			for(var i = 0; i < sequence.length; i++)
				expected[i] = Math.min(Math.max(min, sequence[i]), max);

			sequence.unshift(max);
			sequence.unshift(min);
			break;
		default:
			expected = sequence.slice(0);
	}
	console.log("Sequence: ", sequence);
	console.log("Expected: ", expected);
}
generateSequence();

var cpuHasOut = {
	"reverse": false,
	"sort": false,
	"clamp": false,
	"average": false,
	"print": true
};
var memorySize = {
	"sort": [32, 32],
	"reverse": [32, 0],
	"clamp": [0, 0],
	"average": [0, 0],
	"print": [0, 0]
}

var outPort = rand();
function output(sender, val)
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
		generateSequence();
	}

	cpu.socket.sendJson({cmd: "display", text: text});
	mem.socket.sendJson({cmd: "display", text: text});
	sender.socket.sendJson({cmd: "IOout", error: false});
}

var com = new ComPort(3000);
console.dir(com);

var cpu = {
	tickRate: 5,
	memorySize: memorySize[mode][0],
	modules: ["base", "conditional", "bcdreg", "alu"],
	displayRegs: ["ax", "dx", "ip"],
	setup: function()
	{
		com.master = this.socket;
	},
	in: function(port, val)
	{
		if(port == com.masterPort)
			com.masterListen();
		else
			this.socket.sendJson({cmd: "IOin", error: "Port not connected"});
	},
	out: function(port, val)
	{
		if(port == com.masterPort)
			com.masterSend(val);
		else if(port == outPort && cpuHasOut[mode])
			output(this, val);
		else
			this.socket.sendJson({cmd: "IOout", error: "Port not connected"});
	}
};
var mem = {
	inPort: rand(),

	tickRate: 50,
	memorySize: memorySize[mode][1],
	modules: ["base", "conditional", "loop"],
	displayRegs: ["ax", "cx", "ip"],
	setup: function()
	{
		com.slave = this.socket;
	},
	in: function(port)
	{
		if(port == com.slavePort)
			com.slaveListen();
		else if(port == this.inPort)
			this.socket.sendJson({cmd: "IOin", error: false, value: sequence.shift() || 0});
		else
			this.socket.sendJson({cmd: "IOin", error: "Port not connected"});
	},
	out: function(port, val)
	{
		if(port == com.slavePort)
			com.slaveSend(val);
		else if(port == outPort && !cpuHasOut[mode])
			output(this, val);
		else
			this.socket.sendJson({cmd: "IOout", error: "Port not connected"});
	}
};

module.exports = [
	cpu,
	mem
];
