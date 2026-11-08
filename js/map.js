const mapStage = document.querySelector('.map-stage');
const mapCanvas = document.querySelector('.map-canvas');
const mapContent = document.querySelector('.map-canvas__content');
const mapPins = [...document.querySelectorAll('.map-pin[data-location]')];
const locationOptions = [...document.querySelectorAll('.location-option[data-location]')];
const mapControls = [...document.querySelectorAll('.map-control[data-zoom]')];
const activePointers = new Map();
const minZoom = 1.5;
const maxZoom = 4;

let zoom = minZoom;
let panX = 0;
let panY = 0;
let dragStart = null;
let pinchStart = null;
let suppressPinClick = false;

function applyMapTransform() {
    mapContent.style.setProperty('--map-zoom', zoom);
    mapContent.style.setProperty('--map-pan-x', `${panX}px`);
    mapContent.style.setProperty('--map-pan-y', `${panY}px`);
}

applyMapTransform();

function clampPan() {
    const stageBounds = mapStage.getBoundingClientRect();
    const canvasBounds = mapCanvas.getBoundingClientRect();
    const scaledWidth = canvasBounds.width * zoom;
    const scaledHeight = canvasBounds.height * zoom;
    const maxPanX = (scaledWidth + stageBounds.width) / 2;
    const maxPanY = (scaledHeight + stageBounds.height) / 2;

    panX = Math.min(maxPanX, Math.max(-maxPanX, panX));
    panY = Math.min(maxPanY, Math.max(-maxPanY, panY));
}

function zoomAt(nextZoom, clientX, clientY) {
    const bounds = mapStage.getBoundingClientRect();
    const pointX = clientX - (bounds.left + bounds.width / 2);
    const pointY = clientY - (bounds.top + bounds.height / 2);
    const mapX = (pointX - panX) / zoom;
    const mapY = (pointY - panY) / zoom;

    zoom = Math.min(maxZoom, Math.max(minZoom, nextZoom));
    panX = pointX - mapX * zoom;
    panY = pointY - mapY * zoom;
    clampPan();
    applyMapTransform();
}

function selectLocation(locationId) {
    const pin = mapPins.find(item => item.dataset.location === locationId);
    if (!pin) {
        return;
    }

    mapPins.forEach(item => {
        const selected = item === pin;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
    });

    locationOptions.forEach(option => {
        const selected = option.dataset.location === locationId;
        option.classList.toggle('is-selected', selected);
        option.setAttribute('aria-pressed', String(selected));
    });

    const pinX = Number.parseFloat(pin.style.getPropertyValue('--pin-x')) / 100;
    const pinY = Number.parseFloat(pin.style.getPropertyValue('--pin-y')) / 100;
    const canvasBounds = mapCanvas.getBoundingClientRect();
    zoom = 1.8;
    panX = -canvasBounds.width * (pinX - 0.5) * zoom;
    panY = -canvasBounds.height * (pinY - 0.5) * zoom;
    clampPan();
    applyMapTransform();
}

function getPointerPair() {
    return [...activePointers.values()].slice(0, 2);
}

mapStage.addEventListener('pointerdown', event => {
    if (event.target.closest('.map-pin, .map-controls')) {
        return;
    }
    if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
    }

    event.preventDefault();
    mapStage.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    mapStage.classList.add('is-dragging');
    if (activePointers.size === 1) {
        dragStart = { x: event.clientX, y: event.clientY, panX, panY };
        pinchStart = null;
    } else if (activePointers.size === 2) {
        const [first, second] = getPointerPair();
        const midpointX = (first.x + second.x) / 2;
        const midpointY = (first.y + second.y) / 2;
        const bounds = mapStage.getBoundingClientRect();
        pinchStart = {
            distance: Math.hypot(second.x - first.x, second.y - first.y),
            zoom,
            mapX: (midpointX - bounds.left - bounds.width / 2 - panX) / zoom,
            mapY: (midpointY - bounds.top - bounds.height / 2 - panY) / zoom
        };
        dragStart = null;
    }
});

mapStage.addEventListener('contextmenu', event => {
    event.preventDefault();
});

mapStage.addEventListener('pointermove', event => {
    if (!activePointers.has(event.pointerId)) {
        return;
    }

    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size >= 2 && pinchStart) {
        const [first, second] = getPointerPair();
        const midpointX = (first.x + second.x) / 2;
        const midpointY = (first.y + second.y) / 2;
        const distance = Math.hypot(second.x - first.x, second.y - first.y);
        const bounds = mapStage.getBoundingClientRect();
        zoom = Math.min(maxZoom, Math.max(minZoom, pinchStart.zoom * distance / pinchStart.distance));
        panX = midpointX - bounds.left - bounds.width / 2 - pinchStart.mapX * zoom;
        panY = midpointY - bounds.top - bounds.height / 2 - pinchStart.mapY * zoom;
        clampPan();
        applyMapTransform();
    } else if (dragStart) {
        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;
        panX = dragStart.panX + deltaX;
        panY = dragStart.panY + deltaY;
        clampPan();
        applyMapTransform();
        if (Math.hypot(deltaX, deltaY) > 5) {
            suppressPinClick = true;
        }
    }
});

function finishPointer(event) {
    activePointers.delete(event.pointerId);
    if (activePointers.size === 0) {
        mapStage.classList.remove('is-dragging');
    }
    if (activePointers.size === 1) {
        const [remaining] = getPointerPair();
        dragStart = { x: remaining.x, y: remaining.y, panX, panY };
        pinchStart = null;
    } else {
        dragStart = null;
        pinchStart = null;
    }
}

mapStage.addEventListener('pointerup', finishPointer);
mapStage.addEventListener('pointercancel', finishPointer);

mapStage.addEventListener('wheel', event => {
    event.preventDefault();
    zoomAt(zoom * Math.exp(-event.deltaY * 0.001), event.clientX, event.clientY);
}, { passive: false });

mapControls.forEach(control => {
    control.addEventListener('click', () => {
        const action = control.dataset.zoom;
        if (action === 'reset') {
            zoom = minZoom;
            panX = 0;
            panY = 0;
            applyMapTransform();
            return;
        }

        const bounds = mapStage.getBoundingClientRect();
        const direction = action === 'in' ? 1 : -1;
        zoomAt(
            zoom + direction * 0.25,
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2
        );
    });
});

mapStage.addEventListener('click', event => {
    if (suppressPinClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressPinClick = false;
    }
}, true);

[...mapPins, ...locationOptions].forEach(item => {
    item.addEventListener('click', () => selectLocation(item.dataset.location));
});
