import { state as ModalState } from './store';

export { default as Component } from './Component';

const debug = require('debug')('EngageDock:feature:nightlyBuilds');

const state = ModalState;

export default function initialize() {
  debug('Initialize nightlyBuilds feature');

  function showModal() {
    state.isModalVisible = true;
  }

  function toggleFeature() {
    if (window.ferdi.stores.settings.app.nightly) {
      window.ferdi.actions.settings.update({
        type: 'app',
        data: {
          nightly: false,
        },
      });
      window.ferdi.actions.user.update({
        userData: {
          nightly: false,
        },
      });
    } else {
      // We need to close the settings, otherwise the modal will be drawn under the settings window
      window.ferdi.actions.ui.closeSettings();
      showModal();
    }
  }

  window.ferdi.features.nightlyBuilds = {
    state,
    showModal,
    toggleFeature,
  };
}
