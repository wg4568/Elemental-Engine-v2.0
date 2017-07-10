import server

def customMessageHandler(client, message):
	pass

def clientHandler(client):
	print client

server.run(clientHandler, custom=customMessageHandler)
