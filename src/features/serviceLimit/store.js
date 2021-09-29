import { computed, observable } from 'mobx';
import { FeatureStore } from '../utils/FeatureStore';
import { DEFAULT_SERVICE_LIMIT } from '../../config';

const debug = require('debug')('EngageDock:feature:serviceLimit:store');

export class ServiceLimitStore extends FeatureStore {
  @observable isServiceLimitEnabled = false;

  start(stores, actions) {
    debug('start');
    this.stores = stores;
    this.actions = actions;

    this.isServiceLimitEnabled = false;
  }

  stop() {
    super.stop();

    this.isServiceLimitEnabled = false;
  }

  @computed get userHasReachedServiceLimit() {
    return false;
    // if (!this.isServiceLimitEnabled) return false;

    // return this.serviceLimit !== 0 && this.serviceCount >= this.serviceLimit;
  }

  @computed get serviceLimit() {
    if (!this.isServiceLimitEnabled || this.stores.features.features.serviceLimitCount === 0) return 0;

    return this.stores.features.features.serviceLimitCount || DEFAULT_SERVICE_LIMIT;
  }

  @computed get serviceCount() {
    return this.stores.services.all.length;
  }
}

export default ServiceLimitStore;
