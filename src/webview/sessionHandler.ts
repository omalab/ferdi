const debug = require('debug')('EngageDock:Plugin:SessionHandler');

export class SessionHandler {
  async releaseServiceWorkers() {
    try {
      const registrations =
        await window.navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        registration.unregister();
        debug('ServiceWorker unregistered');
      }
    } catch (error) {
      debug(error);
    }
  }
}
