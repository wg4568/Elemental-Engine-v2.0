// Elememtal object acts as a container for engine
var Elemental = {};

// Starting to form a basic physics engine, for now just rigidbodies and forces
Elemental.Physics = {};

// Rigidbody class
Elemental.Physics.Rigidbody = class {
	constructor() {
		this.posn = Elemental.Vector.Empty;
		this.velocity = Elemental.Vector.Empty;

		this.friction = 1;

		this.zero_threshold = 0.001;
	}

	logic() {
		this.velocity = Elemental.Vector.Multiply(this.velocity, this.friction);

		if (this.xvelocity < this.zero_threshold && this.xvelocity > -this.zero_threshold) {
			this.xvelocity = 0;
		}
		if (this.yvelocity < this.zero_threshold && this.yvelocity > -this.zero_threshold) {
			this.yvelocity = 0;
		}

		this.posn = Elemental.Vector.Add(this.posn, this.velocity);
	}

	addForce(force) {
		this.velocity = Elemental.Vector.Add(this.velocity, force);
	}

	get x() {
		return this.posn.x;
	}

	get y() {
		return this.posn.y;
	}

	get xvelocity() {
		return this.velocity.x;
	}

	get yvelocity() {
		return this.velocity.y;
	}

	set x(val) {
		this.posn.x = val;
	}

	set y(val) {
		this.posn.y = val;
	}

	set xvelocity(val) {
		this.velocity.x = val;
	}

	set yvelocity(val) {
		this.velocity.y = val;
	}
}

// Basic canvas class, manages all interaction with the canvas element
Elemental.Canvas = class {
	constructor(id, fullscreen=false, network=null) {
		this._canvas = document.getElementById(id);
		this._context = this._canvas.getContext("2d");
		this._mousePos = Elemental.Vector.Empty;

		this._fullscreen = fullscreen;

		this.network = network;

		this.keyState = {};
		this.keyStateDown = {};
		this.keyStateUp = {};

		this.mouseState = {};
		this.mouseStateDown = {};
		this.mouseStateUp = {};
	}

	// Getters and setters
	get canvas() {
		return this._canvas;
	}

	get context() {
		return this._context;
	}

	get width() {
		return this.canvas.width;
	}

	set width(value) {
		this.canvas.width = value;
	}

	get height() {
		return this.canvas.height;
	}

	set height(value) {
		this.canvas.height = value;
	}

	get mousePos() {
		return this._mousePos;
	}

	get size() {
		return {x: this.height, y: this.width};
	}

	get center() {
		return {x: this.canvas.width/2, y: this.canvas.height/2};
	}

	// Event handling methods
	keyDownEvent(keycode) {
		this.keyState[keycode] = 1;
		this.keyStateDown[keycode] = 1;
		if (this.network) this.network.keyDownEvent(keycode);
	}

	keyUpEvent(keycode) {
		this.keyState[keycode] = 0;
		this.keyStateUp[keycode] = 1;
		if (this.network) this.network.keyUpEvent(keycode);
	}

	mouseDownEvent(btn) {
		this.mouseState[btn] = 1;
		this.mouseStateDown[btn] = 1;
		if (this.network) this.network.mouseDownEvent(btn);
	}

	mouseUpEvent(btn) {
		this.mouseState[btn] = 0;
		this.mouseStateUp[btn] = 1;
		if (this.network) this.network.mouseUpEvent(btn);
	}

	mouseMoveEvent(event) {
		this._mousePos = new Elemental.Vector(event.offsetX, event.offsetY);
		if (this.network) this.network.mouseMoveEvent(this.mousePos);
	}

	fillWindow() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
	}

	// State reading methods
	keyDown(keycode) {
		var state = this.keyStateDown[keycode];
		if (state == 1) return true;
		else return false;
	}

	keyUp(keycode) {
		var state = this.keyStateUp[keycode];
		if (state == 1) return true;
		else return false;
	}

	keyHeld(keycode) {
		var state = this.keyState[keycode];
		if (state == 1) return true;
		else return false;
	}

	mouseDown(btn) {
		var state = this.mouseStateDown[btn];
		if (state == 1) return true;
		else return false;
	}

	mouseUp(btn) {
		var state = this.mouseStateUp[btn];
		if (state == 1) return true;
		else return false;
	}

	mouseHeld(btn) {
		var state = this.mouseState[btn];
		if (state == 1) return true;
		else return false;
	}

	// Initiation function
	start(func) {
		var parent = this;

		this.canvas.addEventListener('contextmenu', event => event.preventDefault());

		document.addEventListener("keydown", function(event) {
			parent.keyDownEvent(event.keyCode);
		});

		document.addEventListener("keyup", function(event) {
			parent.keyUpEvent(event.keyCode);
		});

		this.canvas.addEventListener("mousemove", function(event) {
			parent.mouseMoveEvent(event);
		}			);

		document.addEventListener("mousedown", function(event) {
			parent.mouseDownEvent(event.button);
		});

		document.addEventListener("mouseup", function(event) {
			parent.mouseUpEvent(event.button);
		});

		if (this.network) {
			this.network.connect();
		}

		if (this._fullscreen) {
			this.fillWindow();
			document.body.style.margin = 0;
			window.addEventListener("resize", function(event){
				parent.fillWindow();
			});
		}

		Elemental.Helpers.GameLoopManager.run(function(time) {
			if (parent.network) {
				parent.network.frame();
			}
			func(parent, time);
			parent.keyStateDown = {};
			parent.keyStateUp = {};
			parent.mouseStateDown = {};
			parent.mouseStateUp = {};
		});
	}

	stop() {
		Elemental.Helpers.GameLoopManager.stop();
	}

	// Draw functions
	drawFill(color) {
		this.drawRect(color, Elemental.Vector.Empty, this.width, this.height);
	}

	drawLine(p1, p2, color="black", width=1, caps="round") {
		this.context.strokeStyle = color;
		this.context.lineWidth = width;
		this.context.lineCap = caps;

		this.context.beginPath();
		this.context.moveTo(p1.x, p1.y);
		this.context.lineTo(p2.x, p2.y);
		this.context.stroke();
	}

	drawText(font, text, posn, color="black") {
		this.context.fillStyle = color;
		this.context.font = font;
		this.context.fillText(text, posn.x, posn.y);
	}

	drawRect(color, posn, w, h) {
		this.context.fillStyle = color;
		this.context.fillRect(posn.x, posn.y, w, h);
	}

	drawImage(image, posn) {
		this.context.drawImage(image, posn.x, posn.y);
	}

	drawSprite(sprite, posn) {
		var toDraw = [];
		var x = posn.x;
		var y = posn.y;
		for (var property in sprite.shapes) {
			if (sprite.shapes.hasOwnProperty(property)) {
				var element = sprite.shapes[property];
				toDraw.push(element);
			}
		}

		toDraw.sort(function(a, b){
			if (a.layer > b.layer) return 1;
			if (a.layer < b.layer) return -1;
			return 0;
		});

		for (var elementIndex in toDraw) {
			var element = toDraw[elementIndex];
			var scaleFactor = sprite.scale * element.scale;

			this.context.strokeStyle = element.lineColor;
			this.context.lineWidth = element.lineWidth;
			this.context.lineCap = element.lineCaps;
			this.context.lineJoin = element.lineCorners;
			this.context.miterLimit = element.lineMiterLimit;
			this.context.setLineDash([element.lineDashWidth, element.lineDashSpacing]);
			this.context.lineDashOffset = element.lineDashOffset;
			this.context.fillStyle = element.fillColor;

			this.context.translate(x, y);
			this.context.rotate(Elemental.Helpers.ToRadians(element.rotation+sprite.rotation));

			this.context.beginPath();

			if (element.type == "poly") {
				this.context.beginPath();
				this.context.moveTo(
					(element.points[0].x-element.center.x)*scaleFactor,
					(element.points[0].y-element.center.y)*scaleFactor
				);
				for (var i=1; i<element.points.length; i++) {
						this.context.lineTo(
						(element.points[i].x-element.center.x)*scaleFactor,
						(element.points[i].y-element.center.y)*scaleFactor
					);
				}
			}

			if (element.type == "arc") {
				this.context.arc(
					(element.arc.center.x-element.center.x)*scaleFactor,
					(element.arc.center.y-element.center.y)*scaleFactor,
					(element.arc.radius)*scaleFactor,
					Elemental.Helpers.ToRadians(element.arc.start),
					Elemental.Helpers.ToRadians(element.arc.end)
				);
			}

			if (element.closePath) {
				this.context.closePath();
			}

			if (element.strokeFirst) {
				if (element.lineWidth > 0) { this.context.stroke(); }
				this.context.fill();
			} else {
				this.context.fill();
				if (element.lineWidth > 0) { this.context.stroke(); }
			}

			this.context.rotate(-Elemental.Helpers.ToRadians(element.rotation+sprite.rotation));
			this.context.translate(-x, -y);
		};
	}
}

// Viewport classes, handle cameras and such
Elemental.Viewport = class {
	constructor(canvas, gridlines=false) {
		this.canvas = canvas;
		this.camera = new Elemental.Vector(0, 0);

		this.gridlines = gridlines;
		this.grid = {
			size: 50,
			color: "black",
		}
	}

	get x() {
		return this.camera.x;
	}

	get y() {
		return this.camera.y;
	}

	get position() {
		return this.camera;
	}

	get posn() {
		return this.camera;
	}

	set x(value) {
		this.camera.x = value;
	}

	set y(value) {
		this.camera.y = value;
	}

	set position(value) {
		this.camera = value;
	}

	set posn(value) {
		this.camera = value;
	}

	get xmin() {
		return this.camera.x - canvas.center.x;
	}

	get xmax() {
		return this.camera.x + canvas.center.x;
	}

	get ymin() {
		return this.camera.y - canvas.center.y;
	}

	get ymax() {
		return this.camera.y + canvas.center.y;
	}

	translatePoint(point) {
		var newPoint = Elemental.Vector.Subtract(point, this.position);
		newPoint = Elemental.Vector.Add(newPoint, this.canvas.center)
		return newPoint;
	}

	drawFill(color) {
		this.canvas.drawFill(color);

		if (this.gridlines) {
			var startPos = new Elemental.Vector(
				(Math.ceil(this.xmin / this.grid.size) * this.grid.size)-this.grid.size,
				(Math.ceil(this.ymin / this.grid.size) * this.grid.size)-this.grid.size
			);
			for (var x = startPos.x; x < this.xmax; x += this.grid.size) {
				this.drawLine(
					new Elemental.Vector(x, this.ymin),
					new Elemental.Vector(x, this.ymax)
				);
			}
			for (var y = startPos.y; y < this.ymax; y += this.grid.size) {
				this.drawLine(
					new Elemental.Vector(this.xmin, y),
					new Elemental.Vector(this.xmax, y)
				);
			}
		}
	}

	drawLine(point1, point2, color="black", width=1, caps="round") {
		this.canvas.drawLine(
			this.translatePoint(point1),
			this.translatePoint(point2),
			color=color,
			width=width,
			caps=caps
		)
	}

	drawText(font, text, posn, color="black") {
		this.canvas.drawText(font, text, this.translatePoint(posn), color=color);
	}

	drawRect(color, posn, w, h) {
		this.canvas.drawRect(color, this.translatePoint(posn), w, h);
	}

	drawImage(image, posn) {
		this.canvas.drawImage(image, this.translatePoint(posn));
	}

	drawSprite(sprite, posn) {
		this.canvas.drawSprite(sprite, this.translatePoint(posn));
	}
}

Elemental.Viewport.Tiled = class extends Elemental.Viewport {
	constructor(canvas, level, tileSize=32, gridlines=false) {
		super(canvas, gridlines=gridlines);
		this.levelRaw = level;
		this.level = {};

		this.parse();
	}

	parse() {
		var level = JSON.parse(atob(this.levelRaw));
		this.level = level;
		this.level.images = {};
		this.tileSize = this.level.tileSize;
		for (var property in this.level.tiles) {
			if (this.level.tiles.hasOwnProperty(property)) {
				var element = this.level.tiles[property];
				this.level.images[property] = Elemental.Helpers.LoadImage(element);
			}
		}
	}

	drawTile(gridPosn, gamePosn) {
		if ((gridPosn.x >= 0) && (gridPosn.y >= 0) && (gridPosn.x < this.level.width) && (gridPosn.y < this.level.height)) {
			var tile = this.level.mapData[gridPosn.y][gridPosn.x];
			var img = this.level.images[tile];
			this.drawImage(img, gamePosn);
		}
	}

	drawTiles() {
		var startPos = new Elemental.Vector(
			(Math.ceil(this.xmin / this.tileSize) * this.tileSize)-this.tileSize,
			(Math.ceil(this.ymin / this.tileSize) * this.tileSize)-this.tileSize
		);
		for (var x = startPos.x; x < this.xmax; x += this.tileSize) {
			for (var y = startPos.y; y < this.ymax; y += this.tileSize) {
				var posn = new Elemental.Vector(x, y);
				var gridPosn = Elemental.Vector.Divide(posn, this.tileSize);
				this.drawTile(gridPosn, posn);
			}
		}
	}
}

// Network class for handling network events (UNUSED)
// Elemental.Network = class {
// 	constructor(server) {
// 		this.server = server;
// 		this.socket = null;
//
// 		this.id = null;
//
// 		this.last_message = 0;
// 		this.ping_frequency = 1;
//
// 		this.state = {};
// 	}
//
// 	frame() {
// 		if (Elemental.Helpers.Now() - this.last_message > this.ping_frequency) {
// 			this.send({
// 				"kind": "imhere"
// 			});
// 			this.last_message = Elemental.Helpers.Now();
// 		}
// 	}
//
// 	send(message) {
// 		message.id = this.id;
// 		var jsonMessage = JSON.stringify(message);
// 		this.socket.send(jsonMessage);
// 	}
//
// 	onMessage(message) {
// 		console.log("RECIEVED", message);
//
// 		if (message.status == "connect") {
// 			this.id = message.id;
// 		}
// 	}
//
// 	// Event handlers (automatically called by canvas)
// 	keyDownEvent(keycode) {
// 		this.send({
// 			kind: "keydown",
// 			keycode: keycode
// 		});
// 	}
//
// 	keyUpEvent(keycode) {
// 		this.send({
// 			kind: "keyup",
// 			keycode: keycode
// 		});
// 	}
//
// 	mouseDownEvent(btn) {
// 		this.send({
// 			kind: "mousedown",
// 			button: btn
// 		});
// 	}
//
// 	mouseUpEvent(btn) {
// 		this.send({
// 			kind: "mouseup",
// 			button: btn
// 		});
// 	}
//
// 	mouseMoveEvent(posn) {
// 		this.send({
// 			kind: "mousemove",
// 			xpos: posn.x,
// 			ypos: posn.y
// 		});
// 	}
//
// 	// Connect to server (called by canvas.start)
// 	connect() {
// 		this.socket = io.connect(this.server);
//
// 		var parent = this;
// 		this.socket.on("message", function(msg) {
// 			parent.onMessage(JSON.parse(msg));
// 		});
// 	}
// }

// Helper object filled with helper functions and classes
Elemental.Helpers = {}

Elemental.Helpers.ToRadians = function(degrees) {
	return degrees * Math.PI / 180;
}

Elemental.Helpers.ToDegrees = function(radians) {
	return radians * 180 / Math.PI;
}

Elemental.Helpers.AngleBetween = function(point1, point2) {
	var rads = Math.atan2(point1.x-point2.x, point1.y-point2.y);
	return -Elemental.Helpers.ToDegrees(rads)+90;
}

Elemental.Helpers.DistanceBetween = function(point1, point2) {
	return Math.sqrt(Math.pow(point1.x-point2.x, 2) + Math.pow(point1.y-point2.y, 2));
}

Elemental.Helpers.StepBetween = function(point1, point2) {
	var hype = Elemental.Helpers.DistanceBetween(point1, point2);
	var dx = (point1.x-point2.x)/hype;
	var dy = (point1.y-point2.y)/hype;
	return new Elemental.Vector(dx, dy);
}

Elemental.Helpers.RandomInt = function(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

Elemental.Helpers.RandomColor = function(r={min: 0, max: 255}, g={min: 0, max: 255}, b={min: 0, max: 255}) {
	var r = Elemental.Helpers.RandomInt(r.min, r.max);
	var g = Elemental.Helpers.RandomInt(g.min, g.max);
	var b = Elemental.Helpers.RandomInt(b.min, b.max);
	return `rgb(${r}, ${g}, ${b})`;
}

Elemental.Helpers.LoadImage = function(url) {
	var img = new Image();
    img.src = url;
	return img;
}

Elemental.Helpers.Now = function() {
	return new Date().getTime() / 1000;
}

// GameLoopManager By Javier Arevalo
Elemental.Helpers.GameLoopManager = new function() {
	this.lastTime = 0;
	this.gameTick = null;
	this.prevElapsed = 0;
	this.prevElapsed2 = 0;

	this.run = function(gameTick) {
		var prevTick = this.gameTick;
		this.gameTick = gameTick;
		if (this.lastTime == 0)
		{
			// Once started, the loop never stops.
			// But this function is called to change tick functions.
			// Avoid requesting multiple frames per frame.
			var bindThis = this;
			requestAnimationFrame(function() { bindThis.tick(); } );
			this.lastTime = 0;
		}
	}

	this.stop = function() {
		this.run(null);
	}

	this.tick = function () {
		if (this.gameTick != null)
		{
			var bindThis = this;
			requestAnimationFrame(function() { bindThis.tick(); } );
		}
		else
		{
			this.lastTime = 0;
			return;
		}
		var timeNow = Date.now();
		var elapsed = timeNow - this.lastTime;
		if (elapsed > 0)
		{
			if (this.lastTime != 0)
			{
				if (elapsed > 1000) // Cap max elapsed time to 1 second to avoid death spiral
				elapsed = 1000;
				// Hackish fps smoothing
				var smoothElapsed = (elapsed + this.prevElapsed + this.prevElapsed2)/3;
				this.gameTick(0.001*smoothElapsed);
				this.prevElapsed2 = this.prevElapsed;
				this.prevElapsed = elapsed;
			}
			this.lastTime = timeNow;
		}
	}
}

Elemental.Sprite = class {
	constructor(shapes) {
		this.rotation = 0;
		this.scale = 1;
		this.shapes = shapes;
	}
}

Elemental.Shape = class {
	constructor(data={}) {
		this.type = null,
		this.layer = 0;
		this.scale = 1;
		this.center = Elemental.Vector.Empty;
		this.rotation = 0;

		this.lineWidth = 1;
		this.lineColor = "black";
		this.lineCaps = "round";
		this.lineCorners = "round";
		this.lineMiterLimit = null;
		this.lineDashWidth = null;
		this.lineDashSpacing = null;

		this.fillColor = null;
		this.closePath = false;
		this.strokeFirst = false;

		this.inherit(data);
	}

	inherit(data) {
		for (var property in data) {
			if (data.hasOwnProperty(property)) {
				this[property] = data[property]
			}
		}
	}
}

Elemental.Shape.Polygon = class extends Elemental.Shape {
	constructor(points, data={}) {
		super();
		this.type = "poly";
		this.points = points;
		this.closePath = true;
		this.fillColor = "grey";

		this.inherit(data);
	}
}

Elemental.Shape.Line = class extends Elemental.Shape {
	constructor(points, data={}) {
		super();
		this.type = "poly";
		this.points = points;
		this.closePath = false;
		this.lineWidth = 1;
		this.lineColor = "black";

		this.inherit(data);
	}
}

Elemental.Shape.Arc = class extends Elemental.Shape {
	constructor(radius, data={}, start=0, end=360) {
		super();
		this.type = "arc";
		this.arc = {
			center: Elemental.Vector.Empty,
			radius: radius,
			start: start,
			end: end
		}
		this.closePath = true;
		this.fillColor = "grey";

		this.inherit(data);
	}
}

// Vector class and function definitions
Elemental.Vector = class {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static get Empty() {
		return {x: 0, y: 0};
	}

	static IsVector(vector) {
		return vector.hasOwnProperty("x") && vector.hasOwnProperty("y");
	}

	static Add() {
		var total = new Elemental.Vector(0, 0);
		for (var i = 0; i < arguments.length; i++ ) {
			if (Elemental.Vector.IsVector(arguments[i])) {
				total.x += arguments[i].x;
				total.y += arguments[i].y;
			} else {
				total.x += arguments[i];
				total.y += arguments[i];
			}
		}
		return total;
	}

	static Subtract() {
		var total = new Elemental.Vector(arguments[0].x, arguments[0].y);
		for (var i = 1; i < arguments.length; i++ ) {
			if (Elemental.Vector.IsVector(arguments[i])) {
				total.x -= arguments[i].x;
				total.y -= arguments[i].y;
			} else {
				total.x -= arguments[i];
				total.y -= arguments[i];
			}
		}
		return total;
	}

	static Multiply() {
		var total = new Elemental.Vector(1, 1);
		for (var i = 0; i < arguments.length; i++ ) {
			if (Elemental.Vector.IsVector(arguments[i])) {
				total.x *= arguments[i].x;
				total.y *= arguments[i].y;
			} else {
				total.x *= arguments[i];
				total.y *= arguments[i];
			}
		}
		return total;
	}

	static Divide() {
		var total = new Elemental.Vector(arguments[0].x, arguments[0].y);
		for (var i = 1; i < arguments.length; i++ ) {
			if (Elemental.Vector.IsVector(arguments[i])) {
				total.x /= arguments[i].x;
				total.y /= arguments[i].y;
			} else {
				total.x /= arguments[i];
				total.y /= arguments[i];
			}
		}
		return total;
	}
}

// Keycode definitions
Elemental.Keycodes = {
	BACKSPACE: 8,
	TAB: 9,
	ENTER: 13,
	SHIFT: 16,
	CTRL: 17,
	ALT: 18,
	BREAK: 19,
	CAPSLOCK: 20,
	ESCAPE: 27,
	SPACE: 32,
	PGUP: 33,
	PGDOWN: 34,
	END: 35,
	HOME: 36,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	INSERT: 45,
	DELETE: 46,
	N0: 48,
	N1: 49,
	N2: 50,
	N3: 51,
	N4: 52,
	N5: 53,
	N6: 54,
	N7: 55,
	N8: 56,
	N9: 57,
	A: 65,
	B: 66,
	C: 67,
	D: 68,
	E: 69,
	F: 70,
	G: 71,
	H: 72,
	I: 73,
	J: 74,
	K: 75,
	L: 76,
	M: 77,
	N: 78,
	O: 79,
	P: 80,
	Q: 81,
	R: 82,
	S: 83,
	T: 84,
	U: 85,
	V: 86,
	W: 87,
	X: 88,
	Y: 89,
	Z: 90,
	LWIN: 91,
	RWIN: 92,
	SELECT: 93,
	NUM0: 96,
	NUM1: 97,
	NUM2: 98,
	NUM3: 99,
	NUM4: 100,
	NUM5: 101,
	NUM6: 102,
	NUM7: 103,
	NUM8: 104,
	NUM9: 105,
	MULTIPLY: 106,
	ADD: 107,
	SUBTRACT: 109,
	PERIOD: 110,
	DIVIDE: 111,
	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123,
	NUMLOCK: 144,
	SCROLLLOCK: 145,
	SEMICOLON: 186,
	EQUAL: 187,
	COMMA: 188,
	DASH: 189,
	PERIOD: 190,
	FSLASH: 191,
	GRAVE: 192,
	OBRACKET: 219,
	BSLASH: 220,
	CBRACKET: 221,
	QUOTE: 222
}

Elemental.Mousecodes = {
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2
}
