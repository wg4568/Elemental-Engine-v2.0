from bs4 import BeautifulSoup
import base64
import json
import zlib

PATH = raw_input("path to .tmx >>> ")
LOCATION = raw_input("path to tiles (from game html page) >>> ")
FILE = raw_input("javascript file to write to >>> ")
NAME = raw_input("variable name in js file >>> ")

with open(PATH, "r") as f:
	RAW = f.read()

soup = BeautifulSoup(RAW, "html.parser")

DIMENSIONS = (
	int(soup.map["width"]),
	int(soup.map["height"])
)

TILESIZE = (
	int(soup.map.tileset["tilewidth"]),
	int(soup.map.tileset["tileheight"])
)

TILEREF = {}
for tileset in soup.find_all("tileset"):
	gid = int(tileset["firstgid"])
	for tile in tileset.find_all("tile"):
		source = tile.image["source"]
		globalID = int(tile["id"])+gid
		TILEREF[globalID] = LOCATION + str(source).split("/")[-1:][0]

MAPDATA = []
lines = soup.map.data.text.split("\n")
lines = map(lambda x: str(x).split(","), lines)
lines = filter(lambda x: len(x)>1, lines)
lines = map(lambda x: filter(lambda y: bool(y), x), lines)
lines = map(lambda x: map(int, x), lines)
for y in xrange(DIMENSIONS[1]):
	line = []
	for x in xrange(DIMENSIONS[0]):
		line.append(lines[y][x])
	MAPDATA.append(line)

JSON = {
	"tiles": TILEREF,
	"width": DIMENSIONS[0],
	"height": DIMENSIONS[1],
	"tileSize": TILESIZE[0],
	"mapData": MAPDATA
}

B64 = base64.b64encode(json.dumps(JSON))

# COMPRESSED = zlib.compress(B64)
#
# COMPRESSED_STRING = "var LEVEL = ["
# for ind, val in enumerate(COMPRESSED):
# 	if ind != 0:
# 		COMPRESSED_STRING += ", "
# 	COMPRESSED_STRING += str(ord(val))
# COMPRESSED_STRING += "];"

JAVASCRIPT = "var %s = \"%s\";" % (NAME, B64)

with open(FILE, "a") as f:
	f.write(JAVASCRIPT + "\n");

print "Injected %s into %s as %s" % (PATH, FILE, NAME)
raw_input()
