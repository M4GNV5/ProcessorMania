var EventEmitter = require("events");
var util = require("util");

function Player()
{
	this.inPorts = [];
	this.outPorts = [];
	EventEmitter.call(this);
}

Player.prototype.send = function(msg)
{
	if(typeof msg == "object")
		msg = JSON.stringify(msg);

	if(this.socket)
		this.socket.send(msg);
}

Player.prototype.setOutput = function(text)
{
	this.send({cmd: "display", text: text});
};
Player.prototype.setInfo = function(text)
{
	this.send({cmd: "info", text: text});
};
Player.prototype.ioIn = function(err, val)
{
	this.send({cmd: "IOin", error: err, value: val});
};
Player.prototype.ioOut = function(err)
{
	this.send({cmd: "IOout", error: err});
};
Player.prototype.raise = function(id, err)
{
	this.send({cmd: "IOout", id: id, text: err});
};

util.inherits(Player, EventEmitter);
module.exports = Player;
