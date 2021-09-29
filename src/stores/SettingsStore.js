import { ipcRenderer } from 'electron';
import { getCurrentWindow } from '@electron/remote';
import {
  action, computed, observable, reaction,
} from 'mobx';
import localStorage from 'mobx-localstorage';
import {
  FILE_SYSTEM_SETTINGS_TYPES, LOCAL_SERVER, SEARCH_ENGINE_DDG,
} from '../config';
import { API, DEFAULT_APP_SETTINGS } from '../environment';
import { getLocale } from '../helpers/i18n-helpers';
import { hash } from '../helpers/password-helpers';
import { SPELLCHECKER_LOCALES } from '../i18n/languages';
import Request from './lib/Request';
import Store from './lib/Store';

const debug = require('debug')('EngageDock:SettingsStore');

export default class SettingsStore extends Store {
  @observable updateAppSettingsRequest = new Request(this.api.local, 'updateAppSettings');

  startup = true;

  fileSystemSettingsTypes = FILE_SYSTEM_SETTINGS_TYPES;

  @observable _fileSystemSettingsCache = {
    app: DEFAULT_APP_SETTINGS,
    proxy: {},
  };

  constructor(...args) {
    super(...args);

    // Register action handlers
    this.actions.settings.update.listen(this._update.bind(this));
    this.actions.settings.remove.listen(this._remove.bind(this));
  }

  async setup() {
    await this._migrate();

    reaction(
      () => this.all.app.autohideMenuBar,
      () => {
        const currentWindow = getCurrentWindow();
        currentWindow.setMenuBarVisibility(!this.all.app.autohideMenuBar);
        currentWindow.autoHideMenuBar = this.all.app.autohideMenuBar;
      },
    );

    reaction(
      () => this.all.app.server,
      (server) => {
        if (server === LOCAL_SERVER) {
          ipcRenderer.send('startLocalServer');
        }
      },
      {
        fireImmediately: true,
      },
    );

    // Inactivity lock timer
    let inactivityTimer;
    getCurrentWindow().on('blur', () => {
      if (this.all.app.inactivityLock !== 0) {
        inactivityTimer = setTimeout(() => {
          this.actions.settings.update({
            type: 'app',
            data: {
              locked: true,
            },
          });
        }, this.all.app.inactivityLock * 1000 * 60);
      }
    });
    getCurrentWindow().on('focus', () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    });

    ipcRenderer.on('appSettings', (event, resp) => {
      // Lock on startup if enabled in settings
      if (this.startup && resp.type === 'app' && resp.data.lockingFeatureEnabled) {
        this.startup = false;
        process.nextTick(() => {
          if (!this.all.app.locked) {
            this.all.app.locked = true;
          }
        });
      }
      debug('Get appSettings resolves', resp.type, resp.data);
      Object.assign(this._fileSystemSettingsCache[resp.type], resp.data);
      ipcRenderer.send('initialAppSettings', resp);
    });

    this.fileSystemSettingsTypes.forEach((type) => {
      ipcRenderer.send('getAppSettings', type);
    });
  }

  @computed get app() {
    return this._fileSystemSettingsCache.app || DEFAULT_APP_SETTINGS;
  }

  @computed get proxy() {
    return this._fileSystemSettingsCache.proxy || {};
  }

  @computed get service() {
    return localStorage.getItem('service') || {
      activeService: '',
    };
  }

  @computed get stats() {
    return localStorage.getItem('stats') || {
      activeService: '',
    };
  }

  @computed get migration() {
    return localStorage.getItem('migration') || {};
  }

  @computed get all() {
    return {
      app: this.app,
      proxy: this.proxy,
      service: this.service,
      stats: this.stats,
      migration: this.migration,
    };
  }

  @action async _update({ type, data }) {
    const appSettings = this.all;
    if (!this.fileSystemSettingsTypes.includes(type)) {
      debug('Update settings', type, data, this.all);
      localStorage.setItem(type, Object.assign(appSettings[type], data));
    } else {
      debug('Update settings on file system', type, data);
      ipcRenderer.send('updateAppSettings', {
        type,
        data,
      });

      Object.assign(this._fileSystemSettingsCache[type], data);
    }
  }

  @action async _remove({ type, key }) {
    if (type === 'app') return; // app keys can't be deleted

    const appSettings = this.all[type];
    if (Object.hasOwnProperty.call(appSettings, key)) {
      delete appSettings[key];

      this.actions.settings.update({
        type,
        data: appSettings,
      });
    }
  }

  // Helper
  async _migrate() {
    const legacySettings = localStorage.getItem('app') || {};

    if (!this.all.migration['5.0.0-beta.17-settings']) {
      this.actions.settings.update({
        type: 'app',
        data: {
          autoLaunchInBackground: legacySettings.autoLaunchInBackground,
          runInBackground: legacySettings.runInBackground,
          enableSystemTray: legacySettings.enableSystemTray,
          minimizeToSystemTray: legacySettings.minimizeToSystemTray,
          closeToSystemTray: legacySettings.closeToSystemTray,
          server: API,
          isAppMuted: legacySettings.isAppMuted,
          enableGPUAcceleration: legacySettings.enableGPUAcceleration,
          showMessageBadgeWhenMuted: legacySettings.showMessageBadgeWhenMuted,
          showDisabledServices: legacySettings.showDisabledServices,
          enableSpellchecking: legacySettings.enableSpellchecking,
        },
      });

      this.actions.settings.update({
        type: 'service',
        data: {
          activeService: legacySettings.activeService,
        },
      });

      this.actions.settings.update({
        type: 'migration',
        data: {
          '5.0.0-beta.17-settings': true,
        },
      });

      localStorage.removeItem('app');

      debug('Migrated settings to split stores');
    }

    if (!this.all.migration['5.0.0-beta.19-settings']) {
      const spellcheckerLanguage = getLocale({
        locale: this.stores.settings.app.locale,
        locales: SPELLCHECKER_LOCALES,
        defaultLocale: DEFAULT_APP_SETTINGS.spellcheckerLanguage,
        fallbackLocale: DEFAULT_APP_SETTINGS.spellcheckerLanguage,
      });

      this.actions.settings.update({
        type: 'app',
        data: {
          spellcheckerLanguage,
        },
      });

      this.actions.settings.update({
        type: 'migration',
        data: {
          '5.0.0-beta.19-settings': true,
        },
      });
    }

    if (!this.all.migration['5.4.4-beta.2-settings']) {
      const {
        showServiceNavigationBar,
      } = this.all.app;

      this.actions.settings.update({
        type: 'app',
        data: {
          navigationBarBehaviour: showServiceNavigationBar ? 'custom' : 'never',
        },
      });

      this.actions.settings.update({
        type: 'migration',
        data: {
          '5.4.4-beta.2-settings': true,
        },
      });
    }

    if (!this.all.migration['5.4.4-beta.4-settings']) {
      this.actions.settings.update({
        type: 'app',
        data: {
          todoServer: 'isUsingCustomTodoService',
          customTodoServer: legacySettings.todoServer,
        },
      });

      this.actions.settings.update({
        type: 'migration',
        data: {
          '5.4.4-beta.4-settings': true,
        },
      });

      debug('Migrated old todo setting to new custom todo setting');
    }

    if (!this.all.migration['5.4.4-beta.4-settings']) {
      this.actions.settings.update({
        type: 'app',
        data: {
          automaticUpdates: !(legacySettings.noUpdates),
        },
      });

      this.actions.settings.update({
        type: 'migration',
        data: {
          '5.4.4-beta.4-settings': true,
        },
      });

      debug('Migrated updates settings');
    }

    if (!this.all.migration['password-hashing']) {
      if (this.stores.settings.app.lockedPassword !== '') {
        this.actions.settings.update({
          type: 'app',
          data: {
            lockedPassword: hash(String(legacySettings.lockedPassword)),
          },
        });
      }

      this.actions.settings.update({
        type: 'migration',
        data: {
          'password-hashing': true,
        },
      });

      debug('Migrated updates settings');
    }

    if (!this.all.migration['5.6.0-beta.6-settings']) {
      this.actions.settings.update({
        type: 'app',
        data: {
          searchEngine: SEARCH_ENGINE_DDG,
        },
      });

      this.actions.settings.update({
        type: 'migration',
        data: {
          '5.6.0-beta.6-settings': true,
        },
      });
    }

    if (!this.all.migration['user-agent-settings']) {
      this.actions.settings.update({
        type: 'app',
        data: {
          userAgentPref: DEFAULT_APP_SETTINGS.userAgentPref,
        },
      });

      this.actions.settings.update({
        type: 'migration',
        data: {
          'user-agent-settings': true,
        },
      });
    }
  }
}
