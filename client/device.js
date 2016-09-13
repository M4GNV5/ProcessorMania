function Device(info)
{
	var self = this;

	this.isHalting = true;
	this.displayRegs = info.displayRegs;
	this.ip = 0;
	this.interrupt = {
		id: 0,
		return: 0,
		handler: -1,
		active: false
	};
	this.register = {
		"int.id": function(val)
		{
			if(typeof val != "undefined")
				self.raise(0, "Cannot set int.id");
			else
				return self.interrupt.id;
		},
		"int.ip": function(val)
		{
			if(typeof val != "undefined")
				self.interrupt.return = val;
			else
				return self.interrupt.return;
		},
		"ip": function(val)
		{
			if(typeof val != "undefined")
				self.raise(0, "Cannot set ip");
			else
				return self.ip;
		}
	};

	if(info.memorySize > 0)
		this.memory = new Uint16Array(info.memorySize);

	this.modules = [];
	info.modules.forEach(function(name)
	{
		var ctor = availableModules[name];
		if(!ctor)
			throw new Error("Unknown module " + name);

		self.modules.push(new ctor(self));
	});

	this.interval = setInterval(function()
	{
		self.tick();
	}, info.tickRate);
}

Device.prototype.raise = function(id, msg)
{
	this.interrupt.id = id & 0xFF;
	this.interrupt.return = this.ip - 1;

	var idString = this.interrupt.id.toString(16).pad(2);
	var returnString = this.interrupt.return.toString(16).pad(2);
	var labelString = "Interrupt: int.id: " + idString + " int.ip: " + returnString;

	if(!this.lines || this.interrupt.active)
	{
		interruptDisplay.innerHTML = "/!\\ " + labelString;
		this.isHalting = true;
		this.outIOHandler = false;
		this.inIOHandler = false;
	}
	else if(this.interrupt.handler < 0 || this.interrupt.handler >= this.lines.length)
	{
		interruptDisplay.innerHTML = "/?\\ " + labelString;
	}
	else
	{
		interruptDisplay.innerHTML = labelString;
		this.interrupt.active = true;

		this.ip = this.interrupt.handler;
		this.isHalting = false;
	}

	throw new Error("Interrupt " + id + " - " + msg);
};

Device.prototype.parse = function(src)
{
	localStorage.code = src;
	this.symbols = {};
	this.lines = src.replace(/;[^\n]*/g, "").split("\n");

	if(this.memory)
		this.memory = new Uint16Array(this.memory.length);

	var raise = this.raise;
	this.raise = function() {};
	for(var key in this.register)
	{
		this.register[key](0);
	}
	this.raise = raise;

	interruptDisplay.innerHTML = "/?\\ Interrupt: int.id: ?? int.ip: ??";
	this.interrupt.active = false;
	this.outIOHandler = false;
	this.inIOHandler = false;

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

	var self = this;
	regDisplay.innerHTML = "";
	this.displayRegs.forEach(function(reg)
	{
		var val = self.getRegister(reg)().toString(16).pad(4);
		reg = reg.toUpperCase();
		regDisplay.innerHTML += "<div class=\"display\">" + reg + ": " + val +"</div> ";
	});

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

	var args = [];
	var hasMemoryAcces = false;
	for(; i < line.length; i++)
	{
		var arg = getArg(",");
		if(arg[0] == "$")
		{
			(function()
			{
				var val;
				arg = arg.substr(1);

				if(arg.length == 3 && arg[0] == "'" && arg[2] == "'")
					val = arg.charCodeAt(1);
				else
					val = parseInt(arg);

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
	name = name.toLowerCase();
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
