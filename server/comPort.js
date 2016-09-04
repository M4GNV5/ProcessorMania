function ComPort(timeout, master, slave, masterPort, slavePort)
{
	this.timeout = timeout;
	this.master = master;
	this.slave = slave;

	this.timeouts = {
		masterListen: false,
		slaveListen: false,
		masterSend: false,
		slaveSend: false
	};

	this.masterPort = masterPort || Math.round(Math.random() * 1000) % 255 + 1;
	this.slavePort = slavePort || Math.round(Math.random() * 1000) % 255 + 1;
}

ComPort.prototype.masterListen = function()
{
	if(this.timeouts.slaveSend)
	{
		clearTimeout(this.timeouts.slaveSend);
		this.master.sendJson({cmd: "IOin", error: false, port: this.masterPort, value: val});
		this.slave.sendJson({cmd: "IOout", error: false});
	}
	else
	{
		this.timeouts.masterListen = setTimeout(function()
		{
			this.timeouts.masterListen = false;
			this.master.sendJson({cmd: "IOout", error: "Timeout"});
		}.bind(this), this.timeout);
	}
};
ComPort.prototype.masterSend = function(val)
{
	if(this.timeouts.slaveListen)
	{
		clearTimeout(this.timeouts.slaveListen);
		this.slave.sendJson({cmd: "IOin", error: false, port: this.slavePort, value: val});
		this.master.sendJson({cmd: "IOout", error: false});
	}
	else
	{
		this.timeouts.masterSend = setTimeout(function()
		{
			this.timeouts.masterSend = false;
			this.master.sendJson({cmd: "IOout", error: "Timeout"});
		}.bind(this), this.timeout);
	}
};

ComPort.prototype.slaveListen = function()
{
	if(this.timeouts.masterSend)
	{
		clearTimeout(this.timeouts.masterSend);
		this.slave.sendJson({cmd: "IOin", error: false, port: this.slavePort, value: val});
		this.master.sendJson({cmd: "IOout", error: false});
	}
	else
	{
		this.timeouts.slaveListen = setTimeout(function()
		{
			this.timeouts.slaveListen = false;
			this.master.sendJson({cmd: "IOout", error: "Timeout"});
		}.bind(this), this.timeout);
	}
};
ComPort.prototype.slaveSend = function(val)
{
	if(this.timeouts.masterListen)
	{
		clearTimeout(this.timeouts.masterListen);
		this.master.sendJson({cmd: "IOin", error: false, port: this.masterPort, value: val});
		this.slave.sendJson({cmd: "IOout", error: false});
	}
	else
	{
		this.timeouts.slaveSend = setTimeout(function()
		{
			this.timeouts.slaveSend = false;
			this.slave.sendJson({cmd: "IOout", error: "Timeout"});
		}.bind(this), this.timeout);
	}
};

module.exports = ComPort;
