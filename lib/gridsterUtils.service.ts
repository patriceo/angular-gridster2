import {Injectable} from '@angular/core';

@Injectable()
export class GridsterUtils {

  static merge(obj1, obj2) {
    for (let p in obj2) {
      if (obj2.hasOwnProperty(p)) {
        if (typeof obj2[p] === 'object') {
          obj1[p] = GridsterUtils.merge(obj1[p], obj2[p]);
        } else {
          obj1[p] = obj2[p];
        }
      }
    }

    return obj1;
  }

  static debounce(func, wait) {
    let timeout;
    return function () {
      const context = this, args = arguments;
      let later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
}
