import {Injectable} from '@angular/core';
import {GridsterItemComponent} from './gridsterItem.component';
import {GridsterSwap} from './gridsterSwap.service';
import {scroll, cancelScroll} from './gridsterScroll.service';
import {GridsterItem} from './gridsterItem.interface';

@Injectable()
export class GridsterDraggable {
  element: HTMLElement;
  gridsterItem: GridsterItemComponent;
  itemCopy: GridsterItem;
  lastMouse: {
    pageX: number,
    pageY: number
  };
  elemPosition: Array<number>;
  position: Array<number>;
  positionBackup: Array<number>;
  enabled: boolean;
  dragStartFunction: EventListenerObject;
  dragFunction: EventListenerObject;
  dragStopFunction: EventListenerObject;

  static touchEvent(e) {
    e.pageX = e.touches[0].pageX;
    e.pageY = e.touches[0].pageY;
  }

  constructor(element: HTMLElement, gridsterItem: GridsterItemComponent) {
    this.element = element;
    this.gridsterItem = gridsterItem;
    this.lastMouse = {
      pageX: 0,
      pageY: 0
    };
    this.elemPosition = [0, 0, 0, 0];
    this.position = [0, 0];
    this.positionBackup = [0, 0];
  }

  dragStart(e) {
    switch (e.which) {
      case 1:
        // left mouse button
        break;
      case 2:
      case 3:
        // right or middle mouse button
        return;
    }
    e.stopPropagation();
    if (e.pageX === undefined && e.touches) {
      GridsterDraggable.touchEvent(e);
    }
    this.dragFunction = this.dragMove.bind(this);
    this.dragStopFunction = this.dragStop.bind(this);

    document.addEventListener('mousemove', this.dragFunction);
    document.addEventListener('mouseup', this.dragStopFunction);
    document.addEventListener('touchmove', this.dragFunction);
    document.addEventListener('touchend', this.dragStopFunction);
    document.addEventListener('touchcancel', this.dragStopFunction);
    this.element.classList.add('gridster-item-moving');
    this.lastMouse.pageX = e.pageX;
    this.lastMouse.pageY = e.pageY;
    this.elemPosition[0] = parseInt(this.element.style.left, 10);
    this.elemPosition[1] = parseInt(this.element.style.top, 10);
    this.elemPosition[2] = this.element.offsetWidth;
    this.elemPosition[3] = this.element.offsetHeight;
    this.itemCopy = JSON.parse(JSON.stringify(this.gridsterItem.state.item, ['rows', 'cols', 'x', 'y']));
    this.gridsterItem.gridster.movingItem = this.gridsterItem.state.item;
    this.gridsterItem.gridster.previewStyle();
  }

  dragMove(e) {
    e.stopPropagation();
    if (e.pageX === undefined && e.touches) {
      GridsterDraggable.touchEvent(e);
    }
    this.elemPosition[0] += e.pageX - this.lastMouse.pageX;
    this.elemPosition[1] += e.pageY - this.lastMouse.pageY;

    scroll(this.elemPosition, this.gridsterItem, e, this.lastMouse, this.calculateItemPosition.bind(this));

    this.lastMouse.pageX = e.pageX;
    this.lastMouse.pageY = e.pageY;

    this.calculateItemPosition();
  }

  dragStop(e) {
    e.stopPropagation();

    cancelScroll();
    document.removeEventListener('mousemove', this.dragFunction);
    document.removeEventListener('mouseup', this.dragStopFunction);
    document.removeEventListener('touchmove', this.dragFunction);
    document.removeEventListener('touchend', this.dragStopFunction);
    document.removeEventListener('touchcancel', this.dragStopFunction);
    this.element.classList.remove('gridster-item-moving');
    this.gridsterItem.gridster.movingItem = null;
    this.gridsterItem.gridster.previewStyle();
    if (this.gridsterItem.gridster.state.options.draggable.stop) {
      Promise.resolve(this.gridsterItem.gridster.state.options.draggable.stop(this.gridsterItem.state.item, this.gridsterItem, e))
        .then(this.makeDrag.bind(this), this.cancelDrag.bind(this));
    } else {
      this.makeDrag();
    }
  }

  cancelDrag() {
    this.gridsterItem.state.item.x = this.itemCopy.x;
    this.gridsterItem.state.item.y = this.itemCopy.y;
    this.gridsterItem.state.item.setSize(true);
  }

  makeDrag() {
    if (this.gridsterItem.gridster.state.options.swap) {
      GridsterSwap.GridsterSwap(this.gridsterItem, this.elemPosition);
    }
    this.gridsterItem.state.item.setSize(true);
    this.gridsterItem.checkItemChanges(this.gridsterItem.state.item, this.itemCopy);
  }

  calculateItemPosition() {
    this.element.style.left = this.elemPosition[0] + 'px';
    this.element.style.top = this.elemPosition[1] + 'px';

    this.position = this.gridsterItem.gridster.pixelsToPosition(this.elemPosition[0], this.elemPosition[1], Math.round);
    if (this.position[0] !== this.gridsterItem.state.item.x || this.position[1] !== this.gridsterItem.state.item.y) {
      this.positionBackup[0] = this.gridsterItem.state.item.x;
      this.positionBackup[1] = this.gridsterItem.state.item.y;
      this.gridsterItem.state.item.x = this.position[0];
      this.gridsterItem.state.item.y = this.position[1];
      if (this.gridsterItem.gridster.checkCollision(this.gridsterItem.state.item)) {
        this.gridsterItem.state.item.x = this.positionBackup[0];
        this.gridsterItem.state.item.y = this.positionBackup[1];
      } else {
        this.gridsterItem.gridster.previewStyle();
      }
    }
  }

  toggle(enable: boolean) {
    const enableDrag = !this.gridsterItem.gridster.state.mobile &&
      (this.gridsterItem.state.item.dragEnabled === undefined ? enable : this.gridsterItem.state.item.dragEnabled);
    if (!this.enabled && enableDrag) {
      this.enabled = !this.enabled;
      this.dragStartFunction = this.dragStart.bind(this);
      this.element.addEventListener('mousedown', this.dragStartFunction);
      this.element.addEventListener('touchstart', this.dragStartFunction);
    } else if (this.enabled && !enableDrag) {
      this.enabled = !this.enabled;
      this.element.removeEventListener('mousedown', this.dragStartFunction);
      this.element.removeEventListener('touchstart', this.dragStartFunction);
    }
  }
}
