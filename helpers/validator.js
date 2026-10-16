const rules = require('../helpers/validationrules'),
    validate = require('validate.js');

const scrub = function(payload){
  if(payload && typeof payload.firstName === 'string'){
      payload.firstName = payload.firstName.trim();
  }

  return payload;
};

exports.scrubAndValidate = function(payload, callback){
  payload = scrub(payload);

  callback(payload, validate(payload, rules.createRules()));
};

exports.scrubAndValidateUpdate = function(payload, callback){
  payload = scrub(payload);

  callback(payload, validate(payload, rules.updateRules()));
};
