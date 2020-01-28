const input = DOMManipulator.getInputElement();
input.onchange = (event) => {
  DOMManipulator.hideInputElement();
  DOMManipulator.showProgressStatus('Reading file...');

  const file = event.target.files[0];
  const reader = new FileReader();

  reader.readAsText(file);
  reader.onload = () => {
    DOMManipulator.showProgressStatus('Parsing file...');
    const xmlData = new DOMParser().parseFromString(reader.result, 'text/xml');
    const coordinates = xmlData.querySelector('Points>DataArray').innerHTML.replace(/\s+/g, ' ').trim().split(' ');
    const pointData = xmlData.querySelector('PointData>DataArray').innerHTML.replace(/\s+/g, ' ').trim().split(' ');

    DOMManipulator.showProgressStatus('Transforming file to objects...');
    let points = Loader.createPoints(coordinates, pointData);
    
    DOMManipulator.showProgressStatus('Normalizing points...');
    points = VectorFieldPointUtils.normalize(points);
    
    const vis = new Visualization(points);

    vis.start();
  }
}