var Player = require("../player.js");
var ComPort = require("../comPort.js");

function rand(max, min)
{
	max = max || 256;
	min = min || 1;
	max = max - min;

	return Math.round(Math.random() * 1000) % max + min;
}

var words = ["kek", "this", "gud", "lel", "rofl", "wow", "wew lad", "luv<3", "m8", "\n", "\n", "\n"];
var fileNames = [];
var files = {};
for(var i = 0; i < 5; i++)
{
	var name;
	do
	{
		name = words[rand(words.length) - 1];
	} while(!/^[a-z]+$/i.test(name));
	fileNames.push(name);
	files[name] = Math.random().toString();
}

var reqIndex;
var reqText;
var reqFile;
var resText;
var resExpected;
function generateRequest()
{
	reqFile = fileNames[rand(fileNames.length) - 1];
	if(files[reqFile] && rand(10) != 1)
	{
		reqText = "GET /" + reqFile + " HTTP/1.0\r\n\r\n";
		reqIndex = 0;
		resExpected = "HTTP/1.0 200 OK\r\n\r\n" + files[reqFile];
		resText = "";
	}
	else
	{
		var len = rand(10);
		var content = [];
		for(var i = 0; i < len; i++)
		{
			content.push(words[rand(words.length) - 1]);
		}
		files[reqFile] = content.join(" ");

		reqText = "PUT /" + reqFile + " HTTP/1.0\r\n\r\n" + files[reqFile];
		reqIndex = 0;
		resExpected = "HTTP/1.0 201 Created\r\n\r\n";
		resText = "";
	}
}
generateRequest();

function addDisplay(player)
{
	var displayPort = rand();
	var str = "";

	player.outPorts.push(displayPort);
	player.on("IOout", function(port, val)
	{
		if(port != displayPort)
			return;

		if(val == 0)
			str = "";
		else
			str += String.fromCharCode(val);

		player.ioOut(false);
		player.updateDisplay();
	});
	player.on("connect", function()
	{
		str = "";
		player.updateDisplay();
	});

	player.updateDisplay = function()
	{
		player.setOutput("Sucessful: " + stats.successful + " Failed: " + stats.failed + " | " + str);
	}
}

var stats = {
	successful: 0,
	failed: 0
}

var netPort = rand();
var addrPort = rand();
var dataPort = rand();

var cpu = new Player();
cpu.info = {
	tickRate: 2,
	memorySize: 256,
	modules: ["base", "conditional", "bcdreg", "alu", "stack"],
	displayRegs: ["ax", "dx", "sp", "ip"],
};
cpu.inPorts.push(netPort);
cpu.outPorts.push(netPort);
cpu.on("IOin", function(port)
{
	if(port == netPort)
	{
		if(reqIndex < reqText.length)
		{
			var val = reqText.charCodeAt(reqIndex++);
			cpu.ioIn(false, val);
		}
		else
		{
			cpu.ioIn(false, 0);
		}
	}
});
cpu.on("IOout", function(port, val)
{
	if(port == netPort)
	{
		if(val != 0)
		{
			resText += String.fromCharCode(val);
			console.log(resText);
		}
		else
		{
			if(resText == resExpected)
				stats.successful++;
			else if(resText.indexOf("HTTP/1.0 404") == 0)
				files[reqFile] = false;
			else
				stats.failed++;

			generateRequest();
			cpu.updateDisplay();
			drive.updateDisplay();
		}

		cpu.ioOut(false);
	}
});

var drive = new Player();
var driveData = new Uint8Array(0xFFFF + 1);
var driveAddress = 0;
drive.info = {
	tickRate: 10,
	memorySize: 32,
	modules: ["base", "loop", "conditional", "bit", "stack"],
	displayRegs: ["ax", "cx", "sp", "ip"],
};
drive.inPorts.push(addrPort, dataPort);
drive.outPorts.push(addrPort, dataPort);
drive.on("IOout", function(port, val)
{
	if(port == addrPort)
	{
		driveAddress = val & 0xFFFF;
		drive.ioOut(false);
	}
	else if(port == dataPort)
	{
		driveData[driveAddress] = val;
		drive.ioOut(false);
	}
});
drive.on("IOin", function(port)
{
	if(port == addrPort)
		drive.ioIn(false, driveAddress);
	else if(port == dataPort)
		drive.ioIn(false, driveData[driveAddress]);
});

var com = new ComPort(3000, cpu, drive);
addDisplay(cpu);
addDisplay(drive);

module.exports = [
	cpu,
	drive
];
