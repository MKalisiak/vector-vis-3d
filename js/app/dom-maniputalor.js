class DOMManipulator {
    static getInputElement() {
        return document.querySelector('#input-file');
    }

    static hideInputElement() {
        document.querySelector('#input-file').style.display = 'none';
    }

    // TODO add a mechanism to allow for DOM to be updated during computation (like web worker)
    static showProgressStatus(text) {
        const header = document.createElement("h1");
        header.appendChild(document.createTextNode(text));
        document.querySelector('#before-vis').appendChild(header);
    }

    static getSceneContainer() {
        return document.querySelector('#scene-container');
    }

    static showSceneContainer() {
        document.querySelector('#before-vis').style.display = 'none';
        document.querySelector('#scene-container').style.display = 'block';
    }

    static addElementToSceneContainer(element) {
        document.querySelector('#scene-container').appendChild(element);
    }
}
