function Device(tickRate, memorySize, modules, mainReg)
{
	this.modules = [];
	this.register = {};
	this.IOBuff = new Uint8Array(256);
	this.isHalting = true;
	this.interruptHandler = 0;
	this.mainReg = mainReg;

	if(memorySize > 0)
		this.memory = new Uint8Array(memorySize);

	var self = this;

	modules.forEach(function(name)
	{
		var ctor = availableModules[name];
		if(!ctor)
			throw new Error("Unknown module " + name);

		self.modules.push(new ctor(self));
	});

	this.interval = setInterval(function()
	{
		self.tick();
	}, tickRate);
}

Device.prototype.raise = function(id, msg)
{
	this.getRegister(this.mainReg)(id);
	this.ip = this.interruptHandler;
	this.isHalting = false;
	interruptDisplay.innerHTML = "Interrupt: " + msg;
	throw new Error("Interrupt " + id + " : " + msg);
};

Device.prototype.parse = function(src)
{
	this.symbols = {};
	this.lines = src.split("\n");

	var self = this;
	this.lines.forEach(function(line, i)
	{
		line = line.trim();
		if(line[line.length - 1] == ":")
		{
			var name = line.substr(0, line.length - 1);
			self.symbols[name] = i;
			self.lines[i] = "";
		}
	});

	this.ip = 0;
	this.isHalting = false;
};

Device.prototype.tick = function()
{
	if(this.isHalting)
		return;

	do
	{
		if(this.ip >= this.lines.length)
			this.raise(1, "Out of code");

		var line = this.lines[this.ip++].trim();
	} while(line == "")
	var i = 0;

	function display(el, name, val)
	{
		if(val < 10)
			val = "0" + val.toString(16);
		else
			val = val.toString(16);

		el.innerHTML = name.toUpperCase() + ": " + val;
	}
	display(ipDisplay, "ip", this.ip);
	display(regDisplay, this.mainReg, this.getRegister(this.mainReg)());

	function getArg(split)
	{
		var j = line.indexOf(split, i);
		if(j < 0)
		{
			var arg = line.substr(i);
			i = line.length;
			return arg;
		}
		else
		{
			var arg = line.substring(i, j).trim();
			i = j + 1;
			return arg;
		}
	}

	var insLabel = getArg(" ");
	var ins = this.getInstruction(insLabel);
	if(!ins)
		this.raise(0, "Unknown instruction " + JSON.stringify(insLabel));

	var self = this;
	var args = [];
	var hasMemoryAcces = false;
	for(; i < line.length; i++)
	{
		var arg = getArg(",");
		if(arg[0] == "$")
		{
			(function()
			{
				var val = parseInt(arg.substr(1));
				args.push(function(setVal)
				{
					if(typeof setVal != "undefined")
						self.raise(0, "Attempting to set a constant");

					return val;
				});
			})();
		}
		else if(arg[0] == "%")
		{
			args.push(this.getRegister(arg.substr(1)));
		}
		else if(!isNaN(arg[0]) && arg.indexOf("(") < 0)
		{
			if(hasMemoryAcces)
				this.raise(0, "Too many memory references");
			hasMemoryAcces = true;

			args.push(this.getMemory(parseInt(arg)));
		}
		else if(arg[0] == "(" || arg[0] == "-" || !isNaN(arg[0]))
		{
			if(hasMemoryAcces)
				this.raise(0, "Too many memory references");
			hasMemoryAcces = true;

			var inner = arg.substring(arg.indexOf("(") + 1, arg.indexOf(")"));
			var addr = arg[0] == "(" ? 0 : parseInt(arg);
			console.log(addr);

			if(inner[0] == "%")
				addr += this.getRegister(inner.substr(1))();
			else
				this.raise(0, "Invalid argument " + arg);

			args.push(this.getMemory(addr));
		}
		else if(this.symbols.hasOwnProperty(arg))
		{
			(function()
			{
				var lineIndex = self.symbols[arg];
				args.push(function(val)
				{
					if(typeof val != "undefined")
						self.raise(0, "Attempting to set a symbol");

					return lineIndex;
				});
			})();
		}
		else
		{
			this.raise(0, "Invalid argument " + JSON.stringify(arg));
		}
	}

	if(args.length != ins.argc)
		this.raise(0, "Invalid use of " + insLabel);

	ins.handler.apply(null, args);
};

Device.prototype.getInstruction = function(ins)
{
	for(var i = 0; i < this.modules.length; i++)
	{
		var module = this.modules[i];
		if(module.hasOwnProperty(ins) && typeof module[ins] == "function")
			return {argc: module.argc[ins], handler: module[ins]};
	}
};

Device.prototype.getRegister = function(name)
{
	if(this.register.hasOwnProperty(name))
		return this.register[name];

	this.raise(2, "Unknown register " + name);
};

Device.prototype.getMemory = function(addr)
{
	if(!this.memory || addr < 0 || addr > this.memory.length)
		this.raise(3, "Invalid memory access");

	var self = this;
	return function(val)
	{
		if(val)
			self.memory[addr] = val;
		else
			return self.memory[addr];
	};
};
