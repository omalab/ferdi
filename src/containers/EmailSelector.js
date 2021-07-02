import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-react-router';
import Layout from '../components/settings/SettingsLayout';

// import RecipePreviewsStore from '../../stores/RecipePreviewsStore';
import UserStore from '../stores/UserStore';
import ServiceStore from '../stores/ServicesStore';
import Loader from '../components/ui/Loader';

import ServiceItem from '../components/settings/services/ServiceItem';

export default @inject('stores', 'actions') @observer class EmailSelector extends Component {
  componentWillUnmount() {
    this.props.actions.service.resetFilter();
    this.props.actions.service.resetStatus();
  }

  deleteService() {
    this.props.actions.service.deleteService();
    this.props.stores.services.resetFilter();
  }

  render() {
    const { services } = this.props.stores;
    const { closeEmailSelector } = this.props.actions.ui;

    const {
      setEmailActive,
    } = this.props.actions.service;
    const isLoading = services.allServicesRequest.isExecuting;

    const allServices = services.allEmailRecipes;

    return (
      <Layout
        closeSettings={closeEmailSelector}
      >
        <div className="theme__dark settings settings__main" style={{ display: 'block', zIndex: -1, borderRadius: '6px' }}>
          <h2 className="headEmail">
            Select an email app
          </h2>
          {isLoading ? (
            <Loader />
          ) : (
            <table className="service-table">
              <tbody>
                {allServices.map(service => (
                  <ServiceItem
                    key={service.id}
                    service={service}
                    goToServiceForm={() => { setEmailActive({ serviceId: service.id, mail: 'test@yopmail.com' }); }}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Layout>

    );
  }
}

EmailSelector.wrappedComponent.propTypes = {
  stores: PropTypes.shape({
    user: PropTypes.instanceOf(UserStore).isRequired,
    services: PropTypes.instanceOf(ServiceStore).isRequired,
    router: PropTypes.instanceOf(RouterStore).isRequired,
  }).isRequired,
  actions: PropTypes.shape({
    service: PropTypes.shape({
      setEmailActive: PropTypes.func.isRequired,
    }).isRequired,
    ui: PropTypes.shape({
      closeEmailSelector: PropTypes.func.isRequired,
    }),
  }).isRequired,
};
