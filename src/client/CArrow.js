class CArrow {
    constructor(pack) {
        for (const key of Object.keys(pack)) {
            this[key] = pack[key];
        }
        this.pos = { x: this.x, y: this.y };
        this.future = { x: this.futureX, y: this.futureY };
        this.lerpAngle = this.angle;
        this.server = { x: this.x, y: this.y };
    }
    smooth(delta) {
        // console.log(this.angle);
        if (!_interpolate) {
            this.pos.x = this.x;
            this.pos.y = this.y;
            this.future.x = this.futureX;
            this.future.y = this.futureY;
            this.lerpAngle = this.angle;
            return;
        }

        // console.log(this.lerpAngle);

        this.pos.x = lerp(this.pos.x, this.x, delta);
        this.pos.y = lerp(this.pos.y, this.y, delta);

        this.future.x = lerp(this.future.x, this.futureX, delta);
        this.future.y = lerp(this.future.y, this.futureY, delta);
        // const dtheta = this.angle - this.lerpAngle;
        // if (dtheta > Math.PI) {
        // 	this.lerpAngle += 2 * Math.PI;
        // } else if (dtheta < -Math.PI) {
        // 	this.lerpAngle -= 2 * Math.PI;
        // }

        // this.lerpAngle = lerp(this.lerpAngle, this.angle, 1)
        this.lerpAngle = this.angle;
        //
    }
    Snap(data) {
        for (const key of Object.keys(data)) {
            // if (data[key] != undefined) {
            this[key] = data[key];
            // }
        }

        // if (data.angle != null) {
        // 	console.log(data)
        // }

        // console.log(data.angle)

        this.server = {
            x: this.x,
            y: this.y,
        };
    }
}
