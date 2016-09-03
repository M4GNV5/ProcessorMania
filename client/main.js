String.prototype.pad = function(len, c)
{
	return new Array(len - this.length + 1).join(c || "0") + this;
};

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/assembly_x86");
editor.setOption("fontSize", 14);

var regDisplay = document.getElementById("regDisplay");
var missionDisplay = document.getElementById("mission");
var interruptDisplay = document.getElementById("interrupt");
var notesText = document.getElementById("notesText");

if(localStorage.notes)
	notesText.value = localStorage.notes;
if(localStorage.code)
	editor.setValue(localStorage.code);

var device;
var ws = new WebSocket("ws://" + document.location.hostname + ":8200");
ws.onmessage = function(ev)
{
	var data = JSON.parse(ev.data);
	switch(data.cmd)
	{
		case "full":
		localStorage.notes = notesText.value;
			notesText.value = "Server full :(";
			return;
		case "start":
			device = new Device(data.tickRate, data.memorySize, data.modules, data.displayRegs);
			document.getElementById("resetButton").disabled = false;
			break;
		case "display":
			missionDisplay.innerHTML = "Output: " + data.text;
		case "IO":
			device.IOBuff[data.port] = data.value;
			break;
		case "raise":
			device.raise(data.id, data.text);
			break;
	}
}
