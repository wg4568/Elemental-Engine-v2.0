import flask
import flask_socketio
import json
import binascii
import os
import time
import threading
import pygame

def random_string(length=16):
	return binascii.hexlify(os.urandom(length/2))

def send_json(message, **kwargs):
	flask_socketio.send(json.dumps(message), **kwargs)

app = flask.Flask(__name__)
app.config["SECRET_KEY"] = random_string(length=32)
socketio = flask_socketio.SocketIO(app)

clients = {}
framerate = 60
max_nohear = 4
messagestack = []
clock = pygame.time.Clock()

clientHandler = None
customMessageHandler = None

class Message:
	def __init__(self, raw):
		try:
			self.data = json.loads(raw)
		except ValueError:
			self.data = {}

	def __str__(self):
		return "Message<%s>(%s)" % (self.id, self.data)

	def __getattr__(self, item):
		if item == "data":
			return self.data
		elif item == "id":
			return str(self.data["id"])
		elif item in self.data:
			return self.data[item]
		else:
			return None

class Client:
	def __init__(self):
		self.private = random_string()
		self.public = random_string()
		self.last_ping = time.time()

	def __str__(self):
		return "Client(%s, %s)" % (self.private, self.public)

	def frame(self):
		clientHandler(self)

	def keyDownEvent(self, key):
		print self, "keydown", key

	def keyUpEvent(self, key):
		print self, "keyup", key

	def mouseDownEvent(self, btn):
		print self, "mousedown", btn

	def mouseUpEvent(self, btn):
		print self, "mouseup", btn

	def mouseMoveEvent(self, posn):
		print self, "mousemove", posn

	def handleCustom(self, message):
		customMessageHandler(self, message)

def frame():
	while True:
		handle_messages()
		push_updates()
		clock.tick(framerate)

def handle_messages():
	global messagestack
	for message in messagestack:
		if message.kind == "connection":
			client = message.client
			clients[client.private] = client
			print "connected " + str(client)
		if message.kind == "disconnect":
			del clients[message.cid]

		try:
			client = clients[message.id]
		except KeyError:
			client = Client()
		client.last_ping = time.time()
		if message.kind == "keydown":
			client.keyDownEvent(message.keycode)
		elif message.kind == "keyup":
			client.keyUpEvent(message.keycode)
		elif message.kind == "mousedown":
			client.mouseDownEvent(message.button)
		elif message.kind == "mouseup":
			client.mouseUpEvent(message.button)
		elif message.kind == "mousemove":
			client.mouseMoveEvent((message.xpos, message.ypos))
		elif message.kind == "imhere":
			pass
		else:
			client.handleCustom(message)
	messagestack = []

def push_updates():
	for ID in clients:
		client = clients[str(ID)]
		if time.time() - client.last_ping > max_nohear:
			print "DISCONNECTED " + str(client)
			msg = Message("{}")
			msg.data = {
				"kind": "disconnect",
				"cid": client.private
			}
			messagestack.append(msg)
		client.frame()

@socketio.on("connect")
def on_connect():
	global messagestack
	client = Client()
	msg = Message("{}")
	msg.data = {
		"kind": "connection",
		"client": client
	}
	messagestack.append(msg)
	send_json({"status": "connect", "id": client.private, "public": client.public})

@socketio.on("message")
def on_message(message):
	global messagestack
	message = Message(message)
	messagestack.append(message)

def customHandler(client, message):
	pass

def run(clienthandle, custom=customHandler, host="0.0.0.0", port=5000):
	global clientHandler, customMessageHandler
	clientHandler = clienthandle
	customMessageHandler = custom
	threading.Thread(target=frame).start()
	socketio.run(app, host=host, port=port)
