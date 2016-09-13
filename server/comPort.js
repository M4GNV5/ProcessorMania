function ComPort(timeout, master, slave, masterPort, slavePort)
{
	masterPort = masterPort || Math.round(Math.random() * 1000) % 255 + 1;
	slavePort = slavePort || Math.round(Math.random() * 1000) % 255 + 1;

	master.inPorts.push(masterPort);
	master.outPorts.push(masterPort);
	slave.inPorts.push(slavePort);
	slave.outPorts.push(slavePort);

	var timeouts = {
		masterListen: false,
		slaveListen: false,
		masterSend: false,
		slaveSend: false
	};
	var masterVal = 0;
	var slaveVal = 0;

	master.on("IOin", function(port)
	{
		if(port != masterPort)
			return;

		if(timeouts.slaveSend)
		{
			clearTimeout(timeouts.slaveSend);
			timeouts.slaveSend = false;

			master.ioIn(false, slaveVal);
			slave.ioOut(false);
		}
		else
		{
			timeouts.masterListen = setTimeout(function()
			{
				timeouts.masterListen = false;
				master.ioIn("timeout");
			}, timeout);
		}
	});
	master.on("IOout", function(port, val)
	{
		if(port != masterPort)
			return;

		if(timeouts.slaveListen)
		{
			clearTimeout(timeouts.slaveListen);
			timeouts.slaveListen = false;

			slave.ioIn(false, val);
			master.ioOut(false);
		}
		else
		{
			masterVal = val;
			timeouts.masterSend = setTimeout(function()
			{
				timeouts.masterSend = false;
				master.ioOut("timeout");
			}, timeout);
		}
	});

	slave.on("IOin", function(port)
	{
		if(port != slavePort)
			return;

		if(timeouts.masterSend)
		{
			clearTimeout(timeouts.masterSend);
			timeouts.masterSend = false;

			slave.ioIn(false, masterVal);
			master.ioOut(false);
		}
		else
		{
			timeouts.slaveListen = setTimeout(function()
			{
				timeouts.slaveListen = false;
				slave.ioIn("timeout");
			}, timeout);
		}
	});

	slave.on("IOout", function(port, val)
	{
		if(port != slavePort)
			return;

		if(timeouts.masterListen)
		{
			clearTimeout(timeouts.masterListen);
			timeouts.masterListen = false;

			master.ioIn(false, val);
			slave.ioOut(false);
		}
		else
		{
			slaveVal = val;
			timeouts.slaveSend = setTimeout(function()
			{
				timeouts.slaveSend = false;
				slave.ioOut("timeout");
			}, timeout);
		}
	});
}

module.exports = ComPort;
