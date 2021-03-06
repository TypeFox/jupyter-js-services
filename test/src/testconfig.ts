// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  getConfigSection, ConfigWithDefaults
} from '../../lib/config';

import {
  JSONObject
} from '../../lib/json';

import {
  RequestHandler, ajaxSettings, expectFailure
} from './utils';


describe('jupyter.services - IConfigSection', () => {

  describe('getConfigSection()', () => {

    it('should complete properly', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, {});
      });
      getConfigSection({ name: 'test' }).then(config => {
        done();
      });
    });

    it('should accept ajaxOptions', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, {});
      });
      getConfigSection({ name: 'test', ajaxSettings }).then(config => {
        done();
      });
    });

    it('should load a config', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, { foo: 'bar' });
      });
      getConfigSection({ name: 'test' }).then(config => {
        expect(config.data['foo']).to.be('bar');
        done();
      });
    });

    it('should fail for an incorrect response', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(201, { });
      });
      let configPromise = getConfigSection({ name: 'test' });
      expectFailure(configPromise, done, 'Invalid Status: 201');
    });

  });

  describe('#update()', () => {

    it('should update a config', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, {});
      });
      getConfigSection({ name: 'test' }).then(config => {
        handler.onRequest = () => {
          handler.respond(200, config.data );
        };
        let update = config.update( { foo: 'baz', spam: 'eggs' });
        update.then((data: any) => {
          expect(data.foo).to.be('baz');
          expect(config.data['foo']).to.be('baz');
          expect(data['spam']).to.be('eggs');
          expect(config.data['spam']).to.be('eggs');
          done();
        });
      });
    });

    it('should accept ajaxOptions', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, {});
      });
      getConfigSection({ name: 'test', ajaxSettings }).then(config => {
        handler.onRequest = () => {
          handler.respond(200, config.data );
        };
        let update = config.update({ foo: 'baz', spam: 'eggs' });
        update.then((data: any) => {
          expect(data.foo).to.be('baz');
          done();
        });
      });
    });

    it('should fail for an incorrect response', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, {});
      });
      getConfigSection({ name: 'test' }).then(config => {
        handler.onRequest = () => {
          handler.respond(201, { });
        };
        let update = config.update({ foo: 'baz' });
        expectFailure(update, done, 'Invalid Status: 201');
      });
    });

  });

});


describe('jupyter.services - ConfigWithDefaults', () => {

  describe('#constructor()', () => {

    it('should complete properly', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, { testclass: { foo: 'bar' } });
      });
      let defaults: JSONObject = { spam: 'eggs' };
      let className = 'testclass';
      getConfigSection({ name: 'test' }).then(section => {
        let config = new ConfigWithDefaults({ section, defaults, className });
        expect(config).to.be.a(ConfigWithDefaults);
        done();
      });
    });

  });

  describe('#get()', () => {

    it('should get a new config value', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, { testclass: { foo: 'bar' } });
      });
      let defaults: JSONObject = { foo: 'bar' };
      let className = 'testclass';
      getConfigSection({ name: 'test' }).then(section => {
        let config = new ConfigWithDefaults({ section, defaults, className });
        let data = config.get('foo');
        expect(data).to.be('bar');
        done();
      });
    });

    it('should get a default config value', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, { testclass: { foo: 'bar' } });
      });
      let defaults: JSONObject = { spam: 'eggs' };
      let className = 'testclass';
      getConfigSection({ name: 'test' }).then(section => {
        let config = new ConfigWithDefaults({ section, defaults, className });
        let data = config.get('spam');
        expect(data).to.be('eggs');
        done();
      });
    });

    it('should get a default config value with no class', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, { foo: 'bar' });
      });
      let defaults: JSONObject = { spam: 'eggs' };
      let className = 'testclass';
      getConfigSection({ name: 'test' }).then(section => {
        let config = new ConfigWithDefaults({ section, defaults, className });
        let data = config.get('spam');
        expect(data).to.be('eggs');
        done();
      });
    });

  });

  describe('#set()', () => {

    it('should set a value in a class immediately', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, {});
      });
      let className = 'testclass';
      getConfigSection({ name: 'test' }).then(section => {
        let config = new ConfigWithDefaults({ section, className });
        handler.onRequest = () => {
          handler.respond(200, {});
          done();
        };
        let set = config.set('foo', 'bar');
        expect(set).to.be.a(Promise);
        let data = section.data['testclass'] as JSONObject;
        expect(data['foo']).to.be('bar');
      });
    });

    it('should set a top level value', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, {});
      });
      getConfigSection({ name: 'test' }).then(section => {
        handler.onRequest = () => {
          handler.respond(200, {foo: 'bar'});
        };
        let config = new ConfigWithDefaults({ section });
        let set = config.set('foo', 'bar');
        expect(section.data['foo']).to.be('bar');
        set.then((data) => {
          expect(section.data['foo']).to.be('bar');
          done();
        });
      });

    });

    it('should fail for an invalid response', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, {});
      });
      getConfigSection({ name: 'test' }).then(section => {
        handler.onRequest = () => {
          handler.respond(201, {foo: 'bar'});
        };
        let config = new ConfigWithDefaults({ section });
        let set = config.set('foo', 'bar');
        expect(section.data['foo']).to.be('bar');
        expectFailure(set, done, 'Invalid Status: 201');
      });

    });

  });

});
