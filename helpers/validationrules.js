const validate = require('validate.js');

// Custom validator: the check-out date must not be earlier than the check-in date.
validate.validators.afterCheckIn = function(value, options, key, attributes) {
  const checkIn = validate.getDeepObjectValue(attributes, 'stay.checkIn');

  if (!value || !checkIn) {
    return null;
  }

  if (new Date(value) < new Date(checkIn)) {
    return 'must not be before checkIn';
  }

  return null;
};

const baseConstraints = function() {
  return {
    firstName: {presence: {allowEmpty: false}},
    lastName: {presence: {allowEmpty: false}},
    totalPrice: {presence: true},
    depositPaid: {presence: true},
    'stay.checkIn': {presence: true},
    'stay.checkOut': {presence: true},
  };
};

exports.createRules = function(){
  return baseConstraints();
};

exports.updateRules = function(){
  const constraints = baseConstraints();

  constraints['stay.checkOut'] = {presence: true, afterCheckIn: true};

  return constraints;
};
