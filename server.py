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

def send_json(message):
	flask_socketio.send(json.dumps(message))

app = flask.Flask(__name__)
app.config["SECRET_KEY"] = random_string(length=32)
socketio = flask_socketio.SocketIO(app)

clients = {}
framerate = 60
messagestack = []
clock = pygame.time.Clock()

def frame():
	while True:
		handle_messages()
		push_updates()
		clock.tick(framerate)

def handle_messages():
	global messagestack
	for message in messagestack:
		print message
	messagestack = []

def push_updates():
	for client in clients:
		pass

@socketio.on("connect")
def on_connect():
	private = random_string()
	public = random_string()
	send_json({"status": "connect", "private": private, "public": public})

@socketio.on("message")
def on_message(message):
	global messagestack
	message = json.loads(message)
	messagestack.append(message)

threading.Thread(target=frame).start()

socketio.run(app, host="0.0.0.0", port=5000)
