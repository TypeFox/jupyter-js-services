// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IAjaxSettings
} from 'jupyter-js-utils';

import * as utils
   from 'jupyter-js-utils';

import {
  JSONObject, JSONValue
} from './json';


/**
 * The url for the config service.
 */
let SERVICE_CONFIG_URL = 'api/config';


/**
 * A Configurable data section.
 */
export
interface IConfigSection {
  /**
   * The data for this section.
   *
   * #### Notes
   * This is a read-only property.
   */
  data: JSONObject;

  /**
   * Modify the stored config values.
   *
   * #### Notes
   * Updates the local data immediately, sends the change to the server,
   * and updates the local data with the response, and fullfils the promise
   * with that data.
   */
  update(newdata: JSONObject): Promise<JSONObject>;

  /**
   * Optional default settings for ajax requests, if applicable.
   */
  ajaxSettings?: IAjaxSettings;
}


/**
 * The namespace for ConfigSection statics.
 */
export
namespace IConfigSection {
  /**
   * The options used to create a config section.
   */
  export
  interface IOptions {
    /**
     * The section name.
     */
    name: string;

    /**
     * The server base url.
     */
    baseUrl?: string;

    /**
     * The default ajax settings.
     */
    ajaxSettings?: IAjaxSettings;
  }
}


/**
 * Create a config section.
 *
 * @returns A Promise that is fulfilled with the config section is loaded.
 */
export
function getConfigSection(options: IConfigSection.IOptions): Promise<IConfigSection> {
  let section = new ConfigSection(options);
  return section.load().then(() => {
    return section;
  });
}


/**
 * Implementation of the Configurable data section.
 */
class ConfigSection implements IConfigSection {
  /**
   * Construct a new config section.
   */
  constructor(options: IConfigSection.IOptions) {
    let baseUrl = options.baseUrl || utils.getBaseUrl();
    this.ajaxSettings = options.ajaxSettings || {};
    this._url = utils.urlPathJoin(baseUrl, SERVICE_CONFIG_URL,
                                  utils.urlJoinEncode(options.name));
  }

  /**
   * Get a copy of the default ajax settings for the section.
   */
  get ajaxSettings(): IAjaxSettings {
    return utils.copy(this._ajaxSettings);
  }
  /**
   * Set the default ajax settings for the section.
   */
  set ajaxSettings(value: IAjaxSettings) {
    this._ajaxSettings = utils.copy(value);
  }

  /**
   * Get the data for this section.
   *
   * #### Notes
   * This is a read-only property.
   */
  get data(): JSONObject {
    return this._data;
  }

  /**
   * Load the initial data for this section.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/config).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  load(): Promise<void> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'GET';
    ajaxSettings.dataType = 'json';
    ajaxSettings.cache = false;
    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      this._data = success.data;
    });
  }

  /**
   * Modify the stored config values.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/config).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * Updates the local data immediately, sends the change to the server,
   * and updates the local data with the response, and fulfils the promise
   * with that data.
   */
  update(newdata: JSONObject): Promise<JSONObject> {
    this._data = utils.extend(this._data, newdata);
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'PATCH';
    ajaxSettings.data = JSON.stringify(newdata);
    ajaxSettings.dataType = 'json';
    ajaxSettings.contentType = 'application/json';

    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }

      this._data = success.data;
      return this._data;
    });
  }

  private _url = 'unknown';
  private _data: JSONObject = null;
  private _ajaxSettings: IAjaxSettings = null;
}


/**
 * Configurable object with defaults.
 */
export
class ConfigWithDefaults {
  /**
   * Create a new config with defaults.
   */
  constructor(options: ConfigWithDefaults.IOptions) {
    this._section = options.section;
    this._defaults = options.defaults || {};
    this._className = options.className || '';
  }

  /**
   * Get data from the config section or fall back to defaults.
   */
  get(key: string): JSONValue {
    return this._classData()[key] || this._defaults[key];
  }

  /**
   * Set a config value.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/config).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * Sends the update to the server, and changes our local copy of the data
   * immediately.
   */
  set(key: string, value: JSONValue): Promise<JSONValue> {
     let d: JSONObject = {};
     d[key] = value;
     if (this._className) {
      let d2: JSONObject = {};
      d2[this._className] = d;
      return this._section.update(d2);
    } else {
      return this._section.update(d);
    }
  }

  /**
   * Get data from the Section with our classname, if available.
   *
   * #### Notes
   * If we have no classname, get all of the data in the Section
   */
  private _classData(): JSONObject {
    if (this._className) {
      return this._section.data[this._className] as JSONObject || {};
    } else {
      return this._section.data;
    }
  }

  private _section: IConfigSection = null;
  private _defaults: JSONObject = null;
  private _className = '';
}


/**
 * A namespace for ConfigWithDefaults statics.
 */
export
namespace ConfigWithDefaults {
  /**
   * The options used to initialize a ConfigWithDefaults object.
   */
  export
  interface IOptions {
    /**
     * The configuration section.
     */
    section: IConfigSection;

    /**
     * The default values.
     */
    defaults?: JSONObject;

    /**
     * The optional classname namespace.
     */
    className?: string;
  }
}
