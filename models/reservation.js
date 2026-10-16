const loki = require('lokijs');

const MAX_RESULTS = 10;

const db = new loki('reservations.db');
const reservations = db.addCollection('reservations');

exports.getIDs = function(query, callback) {
  try {
    const results = reservations.chain().find(query).limit(MAX_RESULTS).data();
    callback(null, results);
  } catch (err) {
    callback(err);
  }
};

exports.get = function(id, callback) {
  try {
    const result = reservations.findOne({ reservationId: parseInt(id) });
    callback(null, result);
  } catch (err) {
    callback(err, null);
  }
};

exports.create = function(payload, callback) {
  try {
    payload.reservationId = payload.reservationId ? parseInt(payload.reservationId) : reservations.count() + 1;
    reservations.insert(payload);
    callback(null, payload);
  } catch (err) {
    callback(err);
  }
};

exports.update = function(id, updated, callback) {
  try {
    const doc = reservations.findOne({ reservationId: parseInt(id) });
    if (!doc) {
      return callback(new Error(`Reservation ${id} not found`));
    }
    Object.assign(doc, updated);
    reservations.update(doc);
    callback(null);
  } catch (err) {
    callback(err);
  }
};

exports.delete = function(id, callback) {
  try {
    const doc = reservations.findOne({ reservationId: parseInt(id) });
    if (!doc) {
      return callback(new Error(`Reservation ${id} not found`));
    }
    reservations.remove(doc);
    callback(null);
  } catch (err) {
    callback(err);
  }
};

exports.deleteAll = function(callback) {
  try {
    reservations.clear();
    callback(null);
  } catch (err) {
    callback(err);
  }
};
