const js2xmlparser = require("js2xmlparser"),
    formurlencoded = require('form-urlencoded').default,
    date = require('date-and-time');

exports.reservationIds = function(req, rawReservations){
  const payload = [];

  rawReservations.forEach(function(r){
    payload.push({
      reservationId: r.reservationId,
    });
  });

  return payload;
}

const toReservation = function(raw){
  const reservation = {
    'firstName': raw.firstName,
    'lastName': raw.lastName,
    'totalPrice': parseInt(raw.totalPrice),
    'depositPaid': Boolean(raw.depositPaid),
    'stay': {
      'checkIn': date.format(new Date(raw.stay.checkIn), 'YYYY-MM-DD'),
      'checkOut': date.format(new Date(raw.stay.checkOut), 'YYYY-MM-DD'),
    }
  };

  if(typeof(raw.specialRequests) !== 'undefined'){
    reservation.specialRequests = raw.specialRequests;
  }

  return reservation;
};

exports.reservation = function(accept, raw){
  try {
    const reservation = toReservation(raw);

    switch(accept){
      case 'application/xml':
        return js2xmlparser.parse('reservation', reservation);
      case 'application/json':
        return reservation;
      case 'application/x-www-form-urlencoded':
        return formurlencoded(reservation);
      case '*/*':
        return reservation;
      default:
        return null;
    }
  } catch(err) {
    return err.message;
  }
}

exports.reservationWithId = function(req, raw){
  try {
    const reservation = toReservation(raw);

    reservation.depositPaid = raw.depositPaid !== undefined;

    const payload = {
      "reservationId": raw.reservationId,
      "reservation": reservation
    };

    switch(req.headers.accept){
      case 'application/xml':
        return js2xmlparser.parse('created-reservation', payload);
      case 'application/json':
        return payload;
      case 'application/x-www-form-urlencoded':
        return formurlencoded(payload);
      case '*/*':
        return payload;
      default:
        return null;
    }
  } catch(err) {
    return err.message;
  }
}
