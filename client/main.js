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

function setNotesText(text)
{
	if(text)
	{
		if(!notesText.disabled)
			localStorage.notes = notesText.value;
		notesText.value = text;
		notesText.disabled = true;
	}
	else
	{
		notesText.value = localStorage.notes;
		notesText.removeAttribute("disabled");
	}
}
function resetDevice()
{
	ws.send(JSON.stringify({cmd: "reset"}));
}

var device;
var ws;
if(document.location.hostname == "m4gnus.de")
	ws = new WebSocket("wss://m4gnus.de:8201"); //nginx proxy
else
	ws = new WebSocket("ws://" + document.location.hostname + ":8200");

setInterval(function()
{
	ws.send("{\"cmd\":\"ping\"}");
}, 10 * 1000);

ws.onclose = function(ev)
{
	setNotesText("Websocket closed with code " + ev.code + " " + ev.reason);
}
ws.onmessage = function(ev)
{
	var data = JSON.parse(ev.data);
	switch(data.cmd)
	{
		case "full":
			setNotesText("Server full :(");
			break;
		case "start":
			device = new Device(data.info);
			document.getElementById("resetButton").disabled = false;
			document.getElementById("interruptButton").disabled = false;
			break;
		case "display":
			missionDisplay.innerHTML = "Output: " + data.text;
			break;
		case "info":
			setNotesText(data.text);
			break;
		case "IOout":
			if(!device.outIOHandler)
				break;
			device.outIOHandler(data.error);
			break;
		case "IOin":
			if(!device.inIOHandler)
				break;
			device.inIOHandler(data.error, data.value);
			break;
		case "raise":
			device.raise(data.id, data.text);
			break;
		case "reset":
			device.parse(editor.getValue());
			break;
	}
}
