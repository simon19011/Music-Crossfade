class DragDrop {
    static dragStart(e, parent) {
        draggedElement = parent;
        isDraggingQueueElement = true;
        e.dataTransfer.effectAllowed = "move";

        let rect = parent.getBoundingClientRect();
        let offsetX = e.clientX - rect.left;
        let offsetY = e.clientY - rect.top;

        e.dataTransfer.setDragImage(parent, offsetX, offsetY); 
    }

    static dragEnd(e) {
        draggedElement = null;
        if (DOMManager.elements.queueContents.contains(dropIndicator)) dropIndicator.remove();
    }
}