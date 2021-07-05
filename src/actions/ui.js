import PropTypes from 'prop-types';

export default {
  openSettings: {
    path: PropTypes.string,
  },
  closeSettings: {},
  openEmailSelector: {
    mail: PropTypes.string
  },
  closeEmailSelector: {},
  toggleServiceUpdatedInfoBar: {
    visible: PropTypes.bool,
  },
};
