class Vec {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    dist(vec) {
        return Math.sqrt(
            (vec.x - this.x) * (vec.x - this.x) +
                (vec.y - this.y) * (vec.y - this.y)
        );
    }
    copy() {
        return new Vec(this.x, this.y);
    }
}

class Line {
	constructor(startX, startY, endX, endY) {
		this.start = new Vec(startX, startY);
		this.end = new Vec(endX, endY);
	}
	render(ctx) {
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(this.start.x, this.start.y);
		ctx.lineTo(this.end.x, this.end.y);
		ctx.stroke();
	}
}

class Ray {
   constructor(x, y, angle, isDeg = true) {
      this.direction = isDeg ? this.computeDirection(angle) : angle;
      this.pos = new Vec(x, y);
   }
   changeAngle(angle) {
      this.direction = angle;
   }
   static getPoints(pos, uniquePoints, lines, radius, limitAngle = [-Math.PI * 2, Math.PI * 2], viewRadius = Infinity) {
      let uniqueAngles = [];
      for (const point of uniquePoints) {
         let angle = Math.atan2(point.y - pos.y, point.x - pos.x);
         if (angle < limitAngle[0]) {
            angle = limitAngle[0];
         }
         if (angle > limitAngle[1]) {
            angle = limitAngle[1];
         }
		if (!uniqueAngles.includes(angle)) {
			// uniqueAngles.push(angle)
         	uniqueAngles.push(angle - 0.00001, angle, angle + 0.00001);
		}
      }

      let intersectionPoints = [];
      for (const angle of uniqueAngles) {
         const ray = new Ray(pos.x, pos.y, angle);
         ray.direction = new Vec(Math.cos(angle), Math.sin(angle));
         ray.pos.x += Math.cos(angle) * radius;
         ray.pos.y += Math.sin(angle) * radius;
         const intersectionPoint = ray.findSecondClosestLine(lines);
         if (intersectionPoint != null || intersectionPoint != undefined) {
            const dist = intersectionPoint.dist(pos);
            if (dist > viewRadius) {
               continue;
            }
            intersectionPoint.angle = angle;
            intersectionPoints.push(intersectionPoint);
         }
      }

      intersectionPoints = intersectionPoints.sort((a, b) => {
         return a.angle - b.angle;
      });

      return intersectionPoints;
   }
   findSecondClosestLine(lines) {
      let bestDistance = Infinity;
      let bestPoint = null;
      let hits = [];
      for (let i = 0; i < lines.length; i++) {
         const line = lines[i];
         const point = this.cast(line);
         if (point == null) {
			 continue;
		 }
         hits.push(point);
		  if (this.pos.dist(point) <= bestDistance) {
			  bestDistance = this.pos.dist(point);
			  bestPoint = point;
		  }
      }
      // hits = hits.sort((a, b) => {
      //    return this.pos.dist(a) - this.pos.dist(b);
      // });
      if (hits.length >= 2) {
		  return bestPoint
      }
      return null;
   }
   findClosestLine(lines) {
      let bestDistance = Infinity;
      let bestPos = null;
      for (let i = 0; i < lines.length; i++) {
         const line = lines[i];
         const point = this.cast(line);
         if (!point) continue;
         const distance = this.pos.dist(point);
         if (distance < bestDistance) {
            bestDistance = distance;
            bestPos = point;
         }
      }
      return bestPos;
   }
   cast(line) {
      const x1 = line.start.x;
      const y1 = line.start.y;
      const x2 = line.end.x;
      const y2 = line.end.y;

      const x3 = this.pos.x;
      const y3 = this.pos.y;
      const x4 = this.pos.x + this.direction.x;	
      const y4 = this.pos.y + this.direction.y;

      const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

      if (den == 0) {
         // lines are completely parallel
         return null;
      }

      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
      const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

      if (t > 0 && t < 1 && u > 0) {
         return new Vec(x1 + t * (x2 - x1), y1 + t * (y2 - y1)); // point
      } else {
         return null;
      }
   }
   computeDirection(angle) {
      const rad = degToRad(angle);
      return new Vec(Math.cos(rad), Math.sin(rad));
   }
}

function degToRad(deg) {
   return (deg * Math.PI) / 180;
}