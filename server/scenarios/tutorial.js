function rand(max, min)
{
	max = max || 256;
	min = min || 1;
	max = max - min;

	return Math.round(Math.random() * 1000) % max + min;
}

var displayPort = rand(255, 2);
var timePort = rand(255, 2);

var steps = [
	{
		text: "Basic IO\n\n" +
			"In ProcessorMania you communicate with other devices and players " +
			"using the serial ports of your processor. To begin this tutorial you have to write " +
			"any value to port 0x01. To write data to a port you use the out instruction " +
			"which has the syntax out <port>, <value>. e.g. out $10, %ax will write the value " +
			"from the register ax to port 10. The assembly in ProcessorMania has a GAS-like " +
			"sytax. That means that e.g. constants are prefixed with $ and registers with %.\n" +
			"For further reading about the syntax go to the Manual",
		out: function(port, val)
		{
			console.log("step 1 " + port + "|" + val);
			if(port == 1)
				return true;
		}
	},
	{
		text: "Basic IO 2\n\n" +
			"Congratulations! Now that you know how to write output to a serial port the next " +
			"step is to read a value. Try reading a value from port 1. The syntax for reading is " +
			"in <port> the read value will be put into the register AX e.g. in $0x17 will read the value " +
			"from port 23 (hexadecimal 0x17) into %ax",
		in: function(port)
		{
			console.log("step 2 " + port);
			if(port == 1)
				return true;
		}
	},
	{
		text: "Finding output ports\n\n" +
		 	"In most ProcessorMania scenarios you will not know which ports of your processor " +
			"are actually connected to a device. To find out you have to loop over every port (0-255) " +
			"and write or read a value. In this case a random port will be selected as a display device " +
			"values you write to the display device will be displayed in decimal in the Output box above. " +
			"To finish this step of the tutorial write the value 42 to the display. This usually invlovles " +
			"writing the port id to the port itself. This will display the correct port id in the display " +
			"and then write 42 to the display. For the first part you will need to create a loop an " +
			"example of 2 loops can be found below:\n\n" +
			"spin: ;define the spin label\n" +
			"    ;LOGIC HERE\n" +
			"    cmp %ax, $0xFF ;check if ax is 0xFF\n" +
			"    jg spin ; if ax > 0xFF we jump to spin\n" +
			"    hlt ; halt execution\n\n" +
			"    mov $10, %cx ; this is another looping technique\n" +
			"spinLoop:\n" +
			"    ;LOGIC HERE\n" +
			"    loop spinLoop\n" +
			"    hlt\n\n" +
			"Note the loop <dst> instruction decremets cx by one and jumps to dst if cx != 0\n\n" +
			"For more information about the instructions used here read the manual",
		displayPort: rand(255, 2),
		out: function(port, val)
		{
			if(port == this.displayPort)
			{
				var text = (val == 42 ? "Correct" : "Wrong") + " value " + val;
				player.socket.sendJson({cmd: "display", text: text});
				if(val == 42)
					return true;
			}
		}
	}
];

var player = {
	tickRate: 10,
	memorySize: 256,
	modules: ["base", "loop", "conditional", "bit", "bcdreg", "alu", "stack"],
	displayRegs: ["ax", "cx", "sp", "ip"],
	step: 0,
	advance()
	{
		this.step++;
		if(this.step >= steps.length)
			player.socket.sendJson({cmd: "info", text: "Congratulations you beat the tutorial"});

		player.socket.sendJson({cmd: "info", text: steps[this.step].text});
	},
	setup: function()
	{
		player.socket.sendJson({cmd: "info", text: steps[this.step].text});
	},
	in: function(port)
	{
		console.log((new Date().toLocaleString()) + " | in " + port);

		var step = steps[this.step] || {};
		if(step.in && step.in(port))
			this.advance();
	},
	out: function(port, val)
	{
		console.log((new Date().toLocaleString()) + " | out " + port + ", " + val);

		var step = steps[this.step] || {};
		if(step.out && step.out(port, val))
			this.advance();
	}
};

module.exports = [
	player
];
