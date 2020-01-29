class Loader {
    static readPoints(xmlData) {
        const coordinates = xmlData.querySelector('Points>DataArray').innerHTML.replace(/\s+/g, ' ').trim().split(' ');
        const pointData = xmlData.querySelector('PointData>DataArray').innerHTML.replace(/\s+/g, ' ').trim().split(' ');
        return { coordinates, pointData };
    }

    static createPoints(coordinates, pointData) {
        if (coordinates.length % 3 !== 0) {
            throw "Wrong number of point coordinates";
        } else if (pointData.length % 3 !== 0) {
            throw "Wrong number of point data";
        } else if (coordinates.length !== pointData.length) {
            throw "Number of point coordinates and data must be the same";
        }

        let x,y,z,dataX,dataY,dataZ;
        const points = [];
        while (coordinates.length > 0) {
            z = parseFloat(coordinates.pop());
            y = parseFloat(coordinates.pop());
            x = parseFloat(coordinates.pop());
            dataZ = parseFloat(pointData.pop());
            dataY = parseFloat(pointData.pop());
            dataX = parseFloat(pointData.pop());

            points.push(new VectorFieldPoint(x, y, z, new Vector(dataX, dataY, dataZ)));
        }

        return points;
    }
}