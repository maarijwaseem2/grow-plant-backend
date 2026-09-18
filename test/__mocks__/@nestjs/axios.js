// Test stub for @nestjs/axios (its real dist is ESM and trips jest).
// The e2e suite doesn't hit /ai/* so a no-op HttpService is enough.
const { Module } = require('@nestjs/common');

class HttpService {
  get() { return { subscribe() {} }; }
  post() { return { subscribe() {} }; }
}

class HttpModule {}
Module({ providers: [HttpService], exports: [HttpService] })(HttpModule);

module.exports = { HttpModule, HttpService };
