var availableModules = {
	"base": BaseModule,
	"loop": LoopModule,
	"conditional": ConditionalModule,
	"bit": BitModule,
	"bcdreg": BCDRegisterModule,
	"alu": AluModule,
	"stack": StackModule
};

function createRegister(size, start)
{
	var val = start || 0;
	return function(setVal)
	{
		if(typeof setVal != "undefined")
			val = setVal & size;
		else
			return val;
	};
}

function BaseModule(device)
{
	var ax = createRegister(0xFFFF);
	device.register.ax = ax;

	this.argc = {
		"nop": 0,
		"lidt": 1,
		"int": 1,
		"iret": 0,
		"hlt": 0,
		"mov": 2,
		"inc": 1,
		"dec": 1,
		"jmp": 1,
		"out": 2,
		"in": 1
	};

	this.nop = function()
	{

	}

	this.lidt = function(handler)
	{
		device.interrupt.handler = handler();
		if(handler < 0 || handler >= device.lines.length)
			interruptDisplay.innerHTML = "/?\\ Interrupt: int.id: ?? int.ip: ??";
		else
			interruptDisplay.innerHTML = "Interrupt: int.id: ?? int.ip: ??";
	}

	this.int = function(id)
	{
		device.ip++;
		device.raise(id(), "User interrupt");
	}

	this.iret = function()
	{
		if(!device.interrupt.active)
			device.raise(0, "Using iret while not in an interrupt");
		device.ip = device.interrupt.return;
		device.interrupt.active = false;
		interruptDisplay.innerHTML = "Interrupt: int.id: ?? int.ip: ??";
	}

	this.hlt = function()
	{
		device.ip++;
		device.isHalting = true;
	}

	this.mov = function(src, dst)
	{
		dst(src());
	}

	this.inc = function(val)
	{
		val(val() + 1);
	}

	this.dec = function(val)
	{
		val(val() - 1);
	}

	this.jmp = function(addr)
	{
		device.ip = addr();
	}

	this.out = function(port, val)
	{
		device.isHalting = true;
		device.interrupt.active = true;

		device.outIOHandler = function(error)
		{
			device.outIOHandler = false;
			device.interrupt.active = false;

			if(error == "timeout")
				device.raise(6, "IO Timeout");
			else if(error)
				device.raise(5, error);

			device.isHalting = false;
		};

		ws.send(JSON.stringify({
			cmd: "out",
			port: port(),
			value: val()
		}));
	}

	this.in = function(port)
	{
		port = port();
		device.isHalting = true;
		device.interrupt.active = true;

		device.inIOHandler = function(error, value)
		{
			device.inIOHandler = false;
			device.interrupt.active = false;

			if(error == "timeout")
				device.raise(6, "IO Timeout");
			else if(error)
				device.raise(5, error);

			ax(value);
			device.isHalting = false;
		};

		ws.send(JSON.stringify({
			cmd: "in",
			port: port
		}));
	}
}

function LoopModule(device)
{
	device.register.cx = createRegister(0xFFFF);

	this.argc = {
		"loop": 1
	}

	this.loop = function(dst)
	{
		var cx = device.register.cx;

		var val = cx() - 1;
		cx(val);

		if(val != 0)
			device.ip = dst();
	}
}

function ConditionalModule(device)
{
	var equal = false;
	var less = false;
	var greater = false;

	this.argc = {
		"cmp": 2,
		"je": 1,
		"jne": 1,
		"jl": 1,
		"jg": 1,
		"jle": 1,
		"jge": 1
	};

	this.cmp = function(src, dst)
	{
		src = src();
		dst = dst();
		equal = src == dst;
		less = src < dst;
		greater = src > dst;
	};

	function createJump(eq, le, gr)
	{
		return function(target)
		{
			target = target();

			if(eq && equal)
				device.ip = target;
			if(le && less)
				device.ip = target;
			if(gr && greater)
				device.ip = target;
		};
	}

	this.je = createJump(true, false, false);
	this.jne = createJump(false, true, true);
	this.jl = createJump(false, true, false);
	this.jg = createJump(false, false, true);
	this.jle = createJump(true, true, false);
	this.jge = createJump(true, false, true);
}

function BitModule(device)
{
	this.argc = {
		"and": 2,
		"or": 2,
		"xor": 2,
		"shl": 2,
		"shr": 2
	};

	this.and = function(src, dst)
	{
		dst(dst() & src());
	}
	this.or = function(src, dst)
	{
		dst(dst() | src());
	}
	this.xor = function(src, dst)
	{
		dst(dst() ^ src());
	}
	this.shl = function(src, dst)
	{
		dst(dst() << src());
	}
	this.shr = function(src, dst)
	{
		dst(dst() >> src());
	}
}

function BCDRegisterModule(device)
{
	device.register.bx = createRegister(0xFFFF);
	device.register.cx = createRegister(0xFFFF);
	device.register.dx = createRegister(0xFFFF);
}

function AluModule(device)
{
	this.argc = {
		"add": 2,
		"sub": 2,
		"mul": 1,
		"div": 1
	};

	this.add = function(src, dst)
	{
		var val = dst() + src();
		dst(val & 0xFFFF);
	};
	this.sub = function(src, dst)
	{
		var val = dst() - src();
		dst(val < 0 ? 0 : val);
	};
	this.mul = function(val)
	{
		var ax= device.getRegister("ax");
		var dx = device.getRegister("dx");

		var result = (dx() << 16) + ax();
		result = result * val();

		ax(result & 0xFFFF);
		dx(result >> 16);
	}
	this.div = function(src, dst)
	{
		var ax = device.getRegister("ax");
		var dx = device.getRegister("dx");
		val = val();

		var result = (dx() << 16) + ax();
		var mod = result % val();
		result = result / val();

		ax(result & 0xFFFF);
		dx(mod & 0xFFFF);
	}
}

function StackModule(device)
{
	var sp = createRegister(0xFFFF, device.memory.length);
	device.register.sp = sp;
	device.register.bp = createRegister(0xFFFF);

	this.argc = {
		"push": 1,
		"pop": 1,
		"call": 1,
		"ret": 1
	};

	this.push = function(val)
	{
		device.getMemory(sp())(val);
		sp(sp() - 1);
	};
	this.pop = function(val)
	{
		sp(sp() + 1);
		val(device.getMemory(sp()));
	};
	this.call = function(val)
	{
		device.getMemory(sp())(device.ip);
		device.ip = val;
		sp(sp() + 1);
	};
	this.ret = function(val)
	{
		device.ip = device.getMemory(sp())();
		sp(sp() - 1);
	};
}
