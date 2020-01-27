class Vector {
    x;
    y;
    z;
    length; // store length as a property for improved performance

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.updateLength();
    }

    updateLength() {
        this.length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
}