String.prototype.pad = function(len, c)
{
	return new Array(len - this.length + 1).join(c) + this;
};

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/assembly_x86");
editor.setOption("fontSize", 14);

var regDisplay = document.getElementById("regDisplay");
var ipDisplay = document.getElementById("ipDisplay");
var missionDisplay = document.getElementById("mission");
var interruptDisplay = document.getElementById("interrupt");

var device;
var ws = new WebSocket("ws://127.0.0.1:8200");
ws.onmessage = function(ev)
{
	var data = JSON.parse(ev.data);
	switch(data.cmd)
	{
		case "full":
			alert("Server full. :(");
			return;
		case "start":
			device = new Device(data.tickRate, data.memorySize, data.modules, data.mainReg);
			break;
		case "display":
			missionDisplay.innerHTML = "Output: " + data.text;
		case "IO":
			device.IOBuff[data.port] = data.value;
			break;
		case "raise":
			device.raise(data.id, data.text);
	}
}
