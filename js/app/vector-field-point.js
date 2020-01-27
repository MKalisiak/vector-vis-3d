class VectorFieldPoint {
    x;
    y;
    z;
    vector;

    constructor(x, y, z, vector) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vector = vector;
    }
}

class VectorFieldPointUtils {
    static _distance(p1, p2) {
        return Math.sqrt( (p1.x - p2.x)*(p1.x - p2.x) + (p1.y - p2.y)*(p1.y - p2.y) + (p1.z - p2.z)*(p1.z - p2.z) )
    }

    // TODO improve the algotithm to not be O(n^2)
    static minimum_distance(points) {
        let min = Number.MAX_VALUE;
        const n = points.length;
        let dist;
        for (let i = 0; i < n; ++i) {
            for (let j = i+1; j < n; ++j) {
                dist = VectorFieldPointUtils._distance(points[i], points[j]);
                if (dist < min) {
                    min = dist; 
                } 
            }
        }
        return min; 
    }

    static normalize(points) {
        let minCoord = Number.MAX_VALUE;
        let maxCoord = Number.MIN_VALUE;
        let maxVector = Number.MIN_VALUE;
        points.forEach(point => {
            if (point.x < minCoord) minCoord = point.x;
            if (point.x > maxCoord) maxCoord = point.x;
            if (point.y < minCoord) minCoord = point.y;
            if (point.y > maxCoord) maxCoord = point.y;
            if (point.z < minCoord) minCoord = point.z;
            if (point.z > maxCoord) maxCoord = point.z;
            
            if (Math.abs(point.vector.x) > maxVector) maxVector = Math.abs(point.vector.x);
            if (Math.abs(point.vector.y) > maxVector) maxVector = Math.abs(point.vector.y);
            if (Math.abs(point.vector.z) > maxVector) maxVector = Math.abs(point.vector.z);
        });

        const coordDivisor = maxCoord - minCoord;

        points.forEach(point => {
            // -1 to 1 normalization
            point.x = 2 * (point.x - minCoord) / coordDivisor - 1;
            point.y = 2 * (point.y - minCoord) / coordDivisor - 1;
            point.z = 2 * (point.z - minCoord) / coordDivisor - 1;

            // -1 to 1 normalization with constant 0
            point.vector.x = point.vector.x / maxVector;
            point.vector.y = point.vector.y / maxVector;
            point.vector.z = point.vector.z / maxVector;
            point.vector.updateLength();
        })

        return points;
    }
}