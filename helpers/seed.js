const date = require('date-and-time');

const randomDate = function (start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomNumber = function (from, to) {
  return Math.floor(Math.random() * (to - from + 1) + from);
};

const pick = function (list) {
  return list[randomNumber(0, list.length - 1)];
};

const FIRST_NAMES = ["Anna", "Lukas", "Mia", "Noah", "Sofia", "Elias"];
const LAST_NAMES = ["Novak", "Fischer", "Rossi", "Dubois", "Kowalski", "Berg"];
const REQUESTS = ["Late check-in", "Extra pillow", "Sea view", "Baby cot"];

exports.createReservation = function(){
  const checkIn = randomDate(new Date(2015, 1, 1), new Date());
  const latest = new Date();
  latest.setDate(latest.getDate() + 3);

  const reservation = {
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    totalPrice: randomNumber(100, 1000),
    depositPaid: pick([true, false]),
    stay: {
      checkIn: date.format(new Date(checkIn.setHours(15, 0, 0, 0)), 'YYYY-MM-DD'),
      checkOut: date.format(new Date(randomDate(checkIn, latest).setHours(12, 0, 0, 0)), 'YYYY-MM-DD')
    }
  };

  if(pick([true, false])){
    reservation.specialRequests = pick(REQUESTS);
  }

  return reservation;
}
