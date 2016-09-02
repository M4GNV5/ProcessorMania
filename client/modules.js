var availableModules = {
	"base": BaseModule,
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
	device.register.al = createRegister(0xFF);

	this.argc = {
		"lidt": 1,
		"int": 1,
		"hlt": 0,
		"mov": 2,
		"jmp": 1,
		"out": 2,
		"in": 2
	};

	this.lidt = function(handler)
	{
		device.interruptHandler = handler();
	}

	this.int = function(id)
	{
		device.raise(id(), "User interrupt");
	}

	this.hlt = function()
	{
		device.isHalting = true;
	}

	this.mov = function(src, dst)
	{
		dst(src());
	}

	this.jmp = function(addr)
	{
		device.ip = addr();
	}

	this.out = function(val, port)
	{
		ws.send(JSON.stringify({
			cmd: "out",
			port: port(),
			value: val()
		}));
	}

	this.in = function(val, port)
	{
		port = port();
		var ret = device.IOBuff[port] || 0;
		console.dir(ret);
		val(ret);

		device.IOBuff[port] = 0;
		ws.send(JSON.stringify({
			cmd: "in",
			port: port
		}));
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
	device.register.bl = createRegister(0xFF);
	device.register.cl = createRegister(0xFF);
	device.register.dl = createRegister(0xFF);
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
		dst(val & 0xFF);
	};
	this.sub = function(src, dst)
	{
		var val = dst() - src();
		dst(val < 0 ? 0 : val);
	};
	this.mul = function(val)
	{
		var al = device.getRegister("al");
		var dl = device.getRegister("dl");

		var result = (dl() << 8) + al();
		result = result * val();

		al(result & 0xFF);
		dl(result >> 8);
	}
	this.div = function(src, dst)
	{
		var al = device.getRegister("al");
		var dl = device.getRegister("dl");
		val = val();

		var result = (dl() << 8) + al();
		var mod = result & val();
		result = result / val();

		al(result & 0xFF);
		dl(mod & 0xFF);
	}
}

function StackModule(device)
{
	var sp = createRegister(0xFF, 255);
	device.register.sp = sp;
	device.register.bp = createRegister(0xFF);

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
