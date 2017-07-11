# Python implementation of some core Elemental functionality
import random
import math
import time

class Elemental:
	class Rigidbody:
		def __init__(self):
			self.posn = Elemental.Vector(0, 0)
			self.velocity = Elemental.Vector(0, 0)

			self.friction = 1

			self.zero_threshold = 0.001

		def logic(self):
			self.velocity = Elemental.Vector.Multiply(self.velocity, self.friction)

			if self.velocity.x < self.zero_threshold and self.velocity.x > -self.zero_threshold:
				self.velocity.x = 0
			if self.velocity.y < self.zero_threshold and self.velocity.y > -self.zero_threshold:
				self.velocity.y = 0

			self.posn = Elemental.Vector.Add(self.posn, self.velocity)

		def addForce(self, force):
			self.velocity = Elemental.Vector.Add(self.velocity, force)

	class Vector:
		def __init__(self, x, y):
			self.x = x
			self.y = y

		def __str__(self):
			return "Vector(%s, %s)" % (self.x, self.y)

		@staticmethod
		def IsVector(vector):
			return isinstance(vector, Elemental.Vector)

		@staticmethod
		def Add(*vectors):
			new = Elemental.Vector(0, 0)
			for v in vectors:
				if Elemental.Vector.IsVector(v):
					new.x += v.x
					new.y += v.y
				else:
					new.x += v
					new.y += v
			return new

		@staticmethod
		def Subtract(*vectors):
			new = vectors[0]
			for i,v in enumerate(vectors):
				if i != 0:
					if Elemental.Vector.IsVector(v):
						new.x -= v.x
						new.y -= v.y
					else:
						new.x -= v
						new.y -= v
			return new

		@staticmethod
		def Multiply(*vectors):
			new = Elemental.Vector(1, 1)
			for v in vectors:
				if Elemental.Vector.IsVector(v):
					new.x *= v.x
					new.y *= v.y
				else:
					new.x *= v
					new.y *= v
			return new

		@staticmethod
		def Divide(*vectors):
			new = vectors[0]
			for i,v in enumerate(vectors):
				if i != 0:
					if Elemental.Vector.IsVector(v):
						new.x /= float(v.x)
						new.y /= float(v.y)
					else:
						new.x /= float(v)
						new.y /= float(v)
			return new

	class Helpers:
		@staticmethod
		def ToRadians(degrees):
			return degrees * math.pi / 180

		@staticmethod
		def ToDegrees(radians):
			return radians * 180 / math.pi

		@staticmethod
		def AngleBetween(point1, point2):
			rads = math.atan2(point1.x-point2.x, point1.y-point2.y)
			return -Elemental.Helpers.ToDegrees(rads)

		@staticmethod
		def DistanceBetween(point1, point2):
			return math.sqrt(((point1.x-point2.x)**2) + ((point1.y-point2.y)**2))

		@staticmethod
		def StepBetween(point1, point2):
			hype = Elemental.Helpers.DistanceBetween(point1, point2)
			dx = (point1.x-point2.x)/hype
			dy = (point1.y-point2.y)/hype
			return Elemental.Vector(dx, dy)

		@staticmethod
		def RandomInt(lower, upper):
			return random.randint(lower, upper)

		@staticmethod
		def RandomColor():
			r = Elemental.Helpers.RandomInt(0, 255)
			g = Elemental.Helpers.RandomInt(0, 255)
			b = Elemental.Helpers.RandomInt(0, 255)
			return "rgb(%s, %s, %s)" % (r, g, b)

		@staticmethod
		def Now():
			return time.time()
