import { isEqual } from '@core/utils';

export default class StoreSubscriber {
  constructor(store) {
    this.store = store;
    this.sub = null;
    this.prevState = {};
  }

  subscribeComponents(components) {
    this.prevState = this.store.getState();

    this.sub = this.store.subscribe(state => {
      Object.keys(state).forEach(key => {
        if (!isEqual(this.prevState[key], state[key])) {
          components.forEach(component => {
            if (component.isWatching(key)) {
              const change = { [key]: state[key] };
              component.storeChanged(change);
            }
          });
        }
      });

      this.prevState = this.store.getState();

      if (process.env.NODE_ENV === 'development') {
        window.$store = this.prevState;
      }
    });
  }

  unsubscribeFromStore() {
    this.sub.unsubscribe();
  }
}
