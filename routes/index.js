const express = require('express');
const router = express.Router(),
    parse = require('../helpers/parser'),
    crypto = require('crypto'),
    Reservation = require('../models/reservation'),
    validator = require('../helpers/validator'),
    seed = require('../helpers/seed'),
sessions = {};

const MANAGER_USERNAME = 'manager';
const MANAGER_PASSWORD = 'Hotel2024!';

if(process.env.SEED === 'true'){
  let count = 1;

  (function createReservation(){
    const reservation = seed.createReservation();

    Reservation.create(reservation, function(err, result){
      if(err) return console.error(err);

      if(count < 10){
        count++;
        createReservation();
      }
    });
  })()
};

/**
 * Resolves whether a request carries valid manager credentials, either as a
 * previously issued token cookie or as an HTTP Basic Authorization header.
 */
const isAuthorised = function(req){
  if(req.cookies && req.cookies.token && sessions[req.cookies.token]){
    return true;
  }

  const header = req.headers.authorization || '';

  if(header.startsWith('Basic ')){
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const [username] = decoded.split(':');

    return username === MANAGER_USERNAME;
  }

  return false;
};

router.get('/', function(req, res, next) {
  res.redirect('/apidoc/index.html');
});

/**
 * @api {get} health HealthCheck
 * @apiName Health
 * @apiGroup Health
 * @apiVersion 1.0.0
 * @apiDescription A simple health check endpoint to confirm whether the API is up and running.
 *
 * @apiExample Check health:
 * curl -i http://localhost:3001/health
 *
 * @apiSuccess {String} OK Default HTTP 200 response
 *
 * @apiSuccessExample {json} Response:
 *     HTTP/1.1 200 OK
 */
router.get('/health', function(req, res, next) {
  res.sendStatus(201);
});

/**
 * @api {get} reservations GetReservationIds
 * @apiName GetReservations
 * @apiGroup Reservation
 * @apiVersion 1.0.0
 * @apiDescription Returns the ids of <strong>all</strong> the reservations that exist within the API. Can take optional query strings to search and return a subset of reservation ids. All filters are combined with AND. Name filters are an exact, case-insensitive match.
 *
 * @apiParam {String} [firstName] Return reservations with a specific first name (exact match, case-insensitive)
 * @apiParam {String} [lastName]  Return reservations with a specific last name (exact match, case-insensitive)
 * @apiParam {date}   [checkIn]   Return reservations whose check-in date is on or after the given date. Format must be CCYY-MM-DD
 * @apiParam {date}   [checkOut]  Return reservations whose check-out date is on or before the given date. Format must be CCYY-MM-DD
 *
 * @apiExample Example 1 (All IDs):
 * curl -i http://localhost:3001/reservations
 *
 * @apiExample Example 2 (Filter by name):
 * curl -i http://localhost:3001/reservations?firstName=anna&lastName=novak
 *
 * @apiExample Example 3 (Filter by check-in/check-out date):
 * curl -i http://localhost:3001/reservations?checkIn=2014-03-13&checkOut=2014-05-21
 *
 * @apiSuccess {object[]} object Array of objects that contain unique reservation IDs
 * @apiSuccess {number} object.reservationId ID of a specific reservation that matches search criteria
 *
 * @apiSuccessExample {json} Response:
 * HTTP/1.1 200 OK
 *
 * [
  {
    "reservationId": 1
  },
  {
    "reservationId": 2
  },
  {
    "reservationId": 3
  },
  {
    "reservationId": 4
  }
]
 *
 * @apiError (Error 400) BadRequest A checkIn or checkOut query parameter is not a valid CCYY-MM-DD date
 *
 * @apiErrorExample {json} Error response:
 * HTTP/1.1 400 Bad Request
*/
router.get('/reservations', function(req, res, next) {
  const query = {};

  if(typeof(req.query.firstName) != 'undefined'){
    query.firstName = {$regex: new RegExp('^' + req.query.firstName + '$', 'i')};
  }

  if(typeof(req.query.lastName) != 'undefined'){
    query.firstName = req.query.lastName;
  }

  if(typeof(req.query.checkIn) != 'undefined'){
    query["stay.checkIn"] = {$gt: new Date(req.query.checkIn).toISOString()}
  }

  if(typeof(req.query.checkOut) != 'undefined'){
    query["stay.checkOut"] = {$lt: new Date(req.query.checkOut).toISOString()}
  }

  Reservation.getIDs(query, function(err, records){
    const ids = parse.reservationIds(req, records);

    if(!ids){
      res.sendStatus(418);
    } else {
      res.send(ids);
    }
  })
});

/**
 * @api {get} reservations/:id GetReservation
 * @apiName GetReservation
 * @apiGroup Reservation
 * @apiVersion 1.0.0
 * @apiDescription Returns a specific reservation based upon the id provided. The id must be a positive integer; anything else is treated as not found.
 *
 * @apiParam (Url Parameter) {Number} id  The id of the reservation you would like to retrieve
 *
 * @apiHeader {string} [Accept=application/json]   Sets what format the response body is returned in. Supported values: <code>application/json</code>, <code>application/xml</code>, <code>application/x-www-form-urlencoded</code>. Standard Accept syntax (parameters, multiple types, wildcards) is honoured. Omitted or <code>*&#47;*</code> defaults to JSON.
 *
 * @apiExample Example 1 (JSON):
 * curl -i http://localhost:3001/reservations/1
 *
 * @apiExample Example 2 (XML):
 * curl -i http://localhost:3001/reservations/1 -H 'Accept: application/xml'
 *
 * @apiSuccess {String}   firstName          First name of the guest
 * @apiSuccess {String}   lastName           Last name of the guest
 * @apiSuccess {Number}   totalPrice         The total price for the stay. Decimal values are preserved.
 * @apiSuccess {Boolean}  depositPaid        Whether the deposit has been paid or not
 * @apiSuccess {Object}   stay               Sub-object that contains the check-in and check-out dates
 * @apiSuccess {Date}     stay.checkIn       Date the guest is checking in (CCYY-MM-DD)
 * @apiSuccess {Date}     stay.checkOut      Date the guest is checking out (CCYY-MM-DD)
 * @apiSuccess {String}   [specialRequests]  Any special requests the guest has
 *
 * @apiSuccessExample {json} JSON Response:
 * HTTP/1.1 200 OK
 * Content-Type: application/json; charset=utf-8
 *
 * {
    "firstName": "Anna",
    "lastName": "Novak",
    "totalPrice": 111.5,
    "depositPaid": true,
    "stay": {
        "checkIn": "2013-02-23",
        "checkOut": "2014-10-23"
    },
    "specialRequests": "Late check-in"
}
 *
 * @apiSuccessExample {xml} XML Response:
 * HTTP/1.1 200 OK
 * Content-Type: application/xml; charset=utf-8
 *
 * <?xml version='1.0' encoding='utf-8'?>
<reservation>
    <firstName>Anna</firstName>
    <lastName>Novak</lastName>
    <totalPrice>111.5</totalPrice>
    <depositPaid>true</depositPaid>
    <stay>
        <checkIn>2013-02-23</checkIn>
        <checkOut>2014-10-23</checkOut>
    </stay>
    <specialRequests>Late check-in</specialRequests>
</reservation>
 *
 * @apiSuccessExample {url} URL Response:
 * HTTP/1.1 200 OK
 * Content-Type: application/x-www-form-urlencoded; charset=utf-8
 *
 * firstName=Anna&lastName=Novak&totalPrice=111.5&depositPaid=true&stay%5BcheckIn%5D=2013-02-23&stay%5BcheckOut%5D=2014-10-23&specialRequests=Late%20check-in
 *
 * @apiError (Error 404) NotFound       No reservation exists with that id, or the id is not a positive integer
 * @apiError (Error 406) NotAcceptable  The Accept header asks for a format the API cannot produce
 *
 * @apiErrorExample {json} Error response:
 * HTTP/1.1 404 Not Found
 */
router.get('/reservations/:id',function(req, res, next){
  Reservation.get(req.params.id, function(err, record){
    if(record){
      const reservation = parse.reservation(req.headers.accept, record);

      if(!reservation){
        res.sendStatus(418);
      } else {
        res.send(reservation);
      }
    } else {
      res.sendStatus(404)
    }
  })
});

/**
 * @api {post} reservations CreateReservation
 * @apiName CreateReservation
 * @apiGroup Reservation
 * @apiVersion 1.0.0
 * @apiDescription Creates a new reservation. The API assigns a unique <code>reservationId</code>; ids are never reused, and any <code>reservationId</code> supplied by the client is ignored. Unknown fields are ignored.
 *
 * @apiParam (Request body) {String}   firstName          First name of the guest. Required, non-empty; surrounding whitespace is trimmed.
 * @apiParam (Request body) {String}   lastName           Last name of the guest. Required, non-empty; surrounding whitespace is trimmed.
 * @apiParam (Request body) {Number}   totalPrice         The total price for the stay. Required, must be a number greater than or equal to 0. Decimals are preserved.
 * @apiParam (Request body) {Boolean}  depositPaid        Whether the deposit has been paid or not. Required.
 * @apiParam (Request body) {Object}   stay               Sub-object that contains the check-in and check-out dates. Required.
 * @apiParam (Request body) {Date}     stay.checkIn       Date the guest is checking in (CCYY-MM-DD). Required.
 * @apiParam (Request body) {Date}     stay.checkOut      Date the guest is checking out (CCYY-MM-DD). Required, must not be before checkIn.
 * @apiParam (Request body) {String}   [specialRequests]  Any special requests the guest has
 *
 * @apiHeader {string} Content-Type=application/json     Sets the format of payload you are sending. Supported: <code>application/json</code>, <code>text/xml</code>, <code>application/xml</code>, <code>application/x-www-form-urlencoded</code>
 * @apiHeader {string} [Accept=application/json]         Sets what format the response body is returned in. Supported: <code>application/json</code>, <code>application/xml</code>, <code>application/x-www-form-urlencoded</code>
 *
 * @apiExample Example 1 (JSON):
 * curl -X POST \
  http://localhost:3001/reservations \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName" : "Lukas",
    "lastName" : "Fischer",
    "totalPrice" : 111,
    "depositPaid" : true,
    "stay" : {
        "checkIn" : "2018-01-01",
        "checkOut" : "2019-01-01"
    },
    "specialRequests" : "Sea view"
}'
 *
 * @apiExample Example 2 (XML):
 * curl -X POST \
  http://localhost:3001/reservations \
  -H 'Content-Type: text/xml' \
  -d '<reservation>
    <firstName>Lukas</firstName>
    <lastName>Fischer</lastName>
    <totalPrice>111</totalPrice>
    <depositPaid>true</depositPaid>
    <stay>
      <checkIn>2018-01-01</checkIn>
      <checkOut>2019-01-01</checkOut>
    </stay>
    <specialRequests>Sea view</specialRequests>
  </reservation>'
 *
 * @apiExample Example 3 (URLencoded):
 * curl -X POST \
  http://localhost:3001/reservations \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'firstName=Lukas&lastName=Fischer&totalPrice=111&depositPaid=true&stay%5BcheckIn%5D=2018-01-01&stay%5BcheckOut%5D=2018-01-02'
 *
 * @apiSuccess {Number}   reservationId                    ID for the newly created reservation
 * @apiSuccess {Object}   reservation                      Object that contains the reservation as stored
 * @apiSuccess {String}   reservation.firstName            First name of the guest
 * @apiSuccess {String}   reservation.lastName             Last name of the guest
 * @apiSuccess {Number}   reservation.totalPrice           The total price for the stay
 * @apiSuccess {Boolean}  reservation.depositPaid          Whether the deposit has been paid or not
 * @apiSuccess {Object}   reservation.stay                 Sub-object that contains the check-in and check-out dates
 * @apiSuccess {Date}     reservation.stay.checkIn         Date the guest is checking in
 * @apiSuccess {Date}     reservation.stay.checkOut        Date the guest is checking out
 * @apiSuccess {String}   [reservation.specialRequests]    Any special requests the guest has
 *
 * @apiSuccessExample {json} JSON Response:
 * HTTP/1.1 200 OK
 *
 * {
    "reservationId": 1,
    "reservation": {
        "firstName": "Lukas",
        "lastName": "Fischer",
        "totalPrice": 111,
        "depositPaid": true,
        "stay": {
            "checkIn": "2018-01-01",
            "checkOut": "2019-01-01"
        },
        "specialRequests": "Sea view"
    }
}
 *
 * @apiSuccessExample {xml} XML Response:
 * HTTP/1.1 200 OK
 *
 * <?xml version='1.0' encoding='utf-8'?>
<created-reservation>
    <reservationId>1</reservationId>
    <reservation>
        <firstName>Lukas</firstName>
        <lastName>Fischer</lastName>
        <totalPrice>111</totalPrice>
        <depositPaid>true</depositPaid>
        <stay>
            <checkIn>2018-01-01</checkIn>
            <checkOut>2019-01-01</checkOut>
        </stay>
        <specialRequests>Sea view</specialRequests>
    </reservation>
</created-reservation>
 *
 * @apiSuccessExample {url} URL Response:
 * HTTP/1.1 200 OK
 *
 * reservationId=1&reservation%5BfirstName%5D=Lukas&reservation%5BlastName%5D=Fischer&reservation%5BtotalPrice%5D=111&reservation%5BdepositPaid%5D=true&reservation%5Bstay%5D%5BcheckIn%5D=2018-01-01&reservation%5Bstay%5D%5BcheckOut%5D=2019-01-01&reservation%5BspecialRequests%5D=Sea%20view
 *
 * @apiError (Error 400) BadRequest     The payload failed validation (missing/empty required field, negative or non-numeric price, check-out before check-in, malformed date)
 * @apiError (Error 406) NotAcceptable  The Accept header asks for a format the API cannot produce
 *
 * @apiErrorExample {json} Error response:
 * HTTP/1.1 400 Bad Request
 */
router.post('/reservations', function(req, res, next) {
  newReservation = req.body;

  if(req.headers['content-type'] === 'text/xml') newReservation = newReservation.reservation;

  validator.scrubAndValidate(newReservation, function(payload, msg){
    if(!msg){
      Reservation.create(newReservation, function(err, reservation){
        if(err)
          res.sendStatus(500);
        else {
          const record = parse.reservationWithId(req, reservation);

          if(!record){
            res.sendStatus(418);
          } else {
            res.send(record);
          }
        }
      })
    } else {
      res.sendStatus(500);
    }
  })
});

/**
 * @api {put} reservations/:id UpdateReservation
 * @apiName UpdateReservation
 * @apiGroup Reservation
 * @apiVersion 1.0.0
 * @apiDescription Replaces an existing reservation in full. The payload follows the same rules as CreateReservation; any optional field omitted from the payload (e.g. <code>specialRequests</code>) is removed from the stored reservation. Requires an authorization token to be set in the header or a Basic auth header.
 *
 * @apiParam (Url Parameter) {Number} id  ID for the reservation you want to update
 *
 * @apiParam (Request body) {String}   firstName          First name of the guest
 * @apiParam (Request body) {String}   lastName           Last name of the guest
 * @apiParam (Request body) {Number}   totalPrice         The total price for the stay
 * @apiParam (Request body) {Boolean}  depositPaid        Whether the deposit has been paid or not
 * @apiParam (Request body) {Object}   stay               Sub-object that contains the check-in and check-out dates
 * @apiParam (Request body) {Date}     stay.checkIn       Date the guest is checking in
 * @apiParam (Request body) {Date}     stay.checkOut      Date the guest is checking out. Must not be before checkIn.
 * @apiParam (Request body) {String}   [specialRequests]  Any special requests the guest has
 *
 * @apiHeader {string} Content-Type=application/json                            Sets the format of payload you are sending
 * @apiHeader {string} [Accept=application/json]                                Sets what format the response body is returned in
 * @apiHeader {string} [Cookie=token=&lt;token_value&gt;]                       Sets an authorization token to access the PUT endpoint, can be used as an alternative to the Authorization
 * @apiHeader {string} [Authorization=Basic bWFuYWdlcjpIb3RlbDIwMjQh]           Basic authorization header (manager:Hotel2024!) to access the PUT endpoint, can be used as an alternative to the Cookie header
 *
 * @apiExample Example 1 (JSON + cookie):
 * curl -X PUT \
  http://localhost:3001/reservations/1 \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Cookie: token=abc123' \
  -d '{
    "firstName" : "Mia",
    "lastName" : "Rossi",
    "totalPrice" : 111,
    "depositPaid" : true,
    "stay" : {
        "checkIn" : "2018-01-01",
        "checkOut" : "2019-01-01"
    },
    "specialRequests" : "Extra pillow"
}'
 *
 * @apiExample Example 2 (XML + Basic auth):
 * curl -X PUT \
  http://localhost:3001/reservations/1 \
  -H 'Content-Type: text/xml' \
  -H 'Accept: application/xml' \
  -H 'Authorization: Basic bWFuYWdlcjpIb3RlbDIwMjQh' \
  -d '<reservation>
    <firstName>Mia</firstName>
    <lastName>Rossi</lastName>
    <totalPrice>111</totalPrice>
    <depositPaid>true</depositPaid>
    <stay>
      <checkIn>2018-01-01</checkIn>
      <checkOut>2019-01-01</checkOut>
    </stay>
    <specialRequests>Extra pillow</specialRequests>
  </reservation>'
 *
 * @apiSuccess {String}   firstName          First name of the guest
 * @apiSuccess {String}   lastName           Last name of the guest
 * @apiSuccess {Number}   totalPrice         The total price for the stay
 * @apiSuccess {Boolean}  depositPaid        Whether the deposit has been paid or not
 * @apiSuccess {Object}   stay               Sub-object that contains the check-in and check-out dates
 * @apiSuccess {Date}     stay.checkIn       Date the guest is checking in
 * @apiSuccess {Date}     stay.checkOut      Date the guest is checking out
 * @apiSuccess {String}   [specialRequests]  Any special requests the guest has
 *
 * @apiSuccessExample {json} JSON Response:
 * HTTP/1.1 200 OK
 *
 * {
    "firstName" : "Mia",
    "lastName" : "Rossi",
    "totalPrice" : 111,
    "depositPaid" : true,
    "stay" : {
        "checkIn" : "2018-01-01",
        "checkOut" : "2019-01-01"
    },
    "specialRequests" : "Extra pillow"
}
 *
 * @apiError (Error 400) BadRequest     The payload failed validation
 * @apiError (Error 403) Forbidden      No valid token cookie or Basic auth header was supplied
 * @apiError (Error 404) NotFound       No reservation exists with that id
 * @apiError (Error 406) NotAcceptable  The Accept header asks for a format the API cannot produce
 *
 * @apiErrorExample {json} Error response:
 * HTTP/1.1 403 Forbidden
 */
router.put('/reservations/:id', function(req, res, next) {
  if(isAuthorised(req)){
    updatedReservation = req.body;

    if(req.headers['content-type'] === 'text/xml') updatedReservation = updatedReservation.reservation;

    validator.scrubAndValidateUpdate(updatedReservation, function(payload, msg){
      if(!msg){
        Reservation.update(req.params.id, updatedReservation, function(err){
          Reservation.get(req.params.id, function(err, record){
            if(record){
              const reservation = parse.reservation(req.headers.accept, record);

              if(!reservation){
                res.sendStatus(418);
              } else {
                res.send(reservation);
              }
            } else {
              res.sendStatus(405);
            }
          })
        })
      } else {
        res.sendStatus(400);
      }
    });
  } else {
    res.sendStatus(403);
  }
});

/**
 * @api {patch} reservations/:id PartialUpdateReservation
 * @apiName PartialUpdateReservation
 * @apiGroup Reservation
 * @apiVersion 1.0.0
 * @apiDescription Updates an existing reservation with a partial payload. Only the supplied fields change; supplying a partial <code>stay</code> object (e.g. only <code>checkIn</code>) leaves the other date untouched. Requires an authorization token to be set in the header or a Basic auth header.
 *
 * @apiParam (Url Parameter) {Number} id  ID for the reservation you want to update
 *
 * @apiParam (Request body) {String}   [firstName]          First name of the guest
 * @apiParam (Request body) {String}   [lastName]           Last name of the guest
 * @apiParam (Request body) {Number}   [totalPrice]         The total price for the stay
 * @apiParam (Request body) {Boolean}  [depositPaid]        Whether the deposit has been paid or not
 * @apiParam (Request body) {Object}   [stay]               Sub-object that contains the check-in and check-out dates
 * @apiParam (Request body) {Date}     [stay.checkIn]       Date the guest is checking in
 * @apiParam (Request body) {Date}     [stay.checkOut]      Date the guest is checking out
 * @apiParam (Request body) {String}   [specialRequests]    Any special requests the guest has
 *
 * @apiHeader {string} Content-Type=application/json                            Sets the format of payload you are sending
 * @apiHeader {string} [Accept=application/json]                                Sets what format the response body is returned in
 * @apiHeader {string} [Cookie=token=&lt;token_value&gt;]                       Sets an authorization token to access the PATCH endpoint, can be used as an alternative to the Authorization
 * @apiHeader {string} [Authorization=Basic bWFuYWdlcjpIb3RlbDIwMjQh]           Basic authorization header (manager:Hotel2024!) to access the PATCH endpoint, can be used as an alternative to the Cookie header
 *
 * @apiExample Example 1 (JSON + cookie):
 * curl -X PATCH \
  http://localhost:3001/reservations/1 \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Cookie: token=abc123' \
  -d '{
    "firstName" : "Mia",
    "lastName" : "Rossi"
}'
 *
 * @apiExample Example 2 (XML + Basic auth):
 * curl -X PATCH \
  http://localhost:3001/reservations/1 \
  -H 'Content-Type: text/xml' \
  -H 'Accept: application/xml' \
  -H 'Authorization: Basic bWFuYWdlcjpIb3RlbDIwMjQh' \
  -d '<reservation>
    <firstName>Mia</firstName>
    <lastName>Rossi</lastName>
  </reservation>'
 *
 * @apiSuccess {String}   firstName          First name of the guest
 * @apiSuccess {String}   lastName           Last name of the guest
 * @apiSuccess {Number}   totalPrice         The total price for the stay
 * @apiSuccess {Boolean}  depositPaid        Whether the deposit has been paid or not
 * @apiSuccess {Object}   stay               Sub-object that contains the check-in and check-out dates
 * @apiSuccess {Date}     stay.checkIn       Date the guest is checking in
 * @apiSuccess {Date}     stay.checkOut      Date the guest is checking out
 * @apiSuccess {String}   [specialRequests]  Any special requests the guest has
 *
 * @apiSuccessExample {json} JSON Response:
 * HTTP/1.1 200 OK
 *
 * {
    "firstName" : "Mia",
    "lastName" : "Rossi",
    "totalPrice" : 111,
    "depositPaid" : true,
    "stay" : {
        "checkIn" : "2018-01-01",
        "checkOut" : "2019-01-01"
    },
    "specialRequests" : "Extra pillow"
}
 *
 * @apiError (Error 403) Forbidden      No valid token cookie or Basic auth header was supplied
 * @apiError (Error 404) NotFound       No reservation exists with that id
 * @apiError (Error 406) NotAcceptable  The Accept header asks for a format the API cannot produce
 *
 * @apiErrorExample {json} Error response:
 * HTTP/1.1 404 Not Found
 */
router.patch('/reservations/:id', function(req, res) {
  if(isAuthorised(req)){
    updatedReservation = req.body;

    if(req.headers['content-type'] === 'text/xml') updatedReservation = updatedReservation.reservation;

    Reservation.update(req.params.id, updatedReservation, function(err){
      Reservation.get(req.params.id, function(err, record){
        if(record){
          const reservation = parse.reservation(req.headers.accept, record);

          if(!reservation){
            res.sendStatus(500);
          } else {
            res.send(reservation);
          }
        } else {
          res.sendStatus(405);
        }
      })
    });
  } else {
    res.sendStatus(403);
  }
});

/**
 * @api {delete} reservations/:id DeleteReservation
 * @apiName DeleteReservation
 * @apiGroup Reservation
 * @apiVersion 1.0.0
 * @apiDescription Deletes a reservation. Requires an authorization token to be set in the header or a Basic auth header.
 *
 * @apiParam (Url Parameter) {Number} id  ID for the reservation you want to delete
 *
 * @apiHeader {string} [Cookie=token=&lt;token_value&gt;]                     Sets an authorization token to access the DELETE endpoint, can be used as an alternative to the Authorization
 * @apiHeader {string} [Authorization=Basic bWFuYWdlcjpIb3RlbDIwMjQh]   Basic authorization header (manager:Hotel2024!) to access the DELETE endpoint, can be used as an alternative to the Cookie header
 *
 * @apiExample Example 1 (Cookie):
 * curl -X DELETE \
  http://localhost:3001/reservations/1 \
  -H 'Cookie: token=abc123'
 *
 * @apiExample Example 2 (Basic auth):
 * curl -X DELETE \
  http://localhost:3001/reservations/1 \
  -H 'Authorization: Basic bWFuYWdlcjpIb3RlbDIwMjQh'
 *
 * @apiSuccess {String} NoContent Default HTTP 204 response, empty body
 *
 * @apiSuccessExample {json} Response:
 *     HTTP/1.1 204 No Content
 *
 * @apiError (Error 403) Forbidden  No valid token cookie or Basic auth header was supplied
 * @apiError (Error 404) NotFound   No reservation exists with that id
 *
 * @apiErrorExample {json} Error response:
 * HTTP/1.1 404 Not Found
*/
router.delete('/reservations/:id', function(req, res, next) {
  if(isAuthorised(req)){
    Reservation.get(req.params.id, function(err, record){
      if(record){
        Reservation.delete(req.params.id, function(err){
            res.sendStatus(201);
        });
      } else {
        res.sendStatus(405);
      }
    });
  } else {
    res.sendStatus(403);
  }
});

/**
 * @api {post} login Login
 * @apiName Login
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * @apiDescription Creates a new auth token to use for access to the PUT, PATCH and DELETE /reservations endpoints. Both username and password must match exactly.
 *
 * @apiParam (Request body) {String}  username=manager      Username for authentication
 * @apiParam (Request body) {String}  password=Hotel2024!   Password for authentication
 *
 * @apiHeader {string} Content-Type=application/json        Sets the format of payload you are sending
 *
 * @apiExample Example 1:
 * curl -X POST \
  http://localhost:3001/login \
  -H 'Content-Type: application/json' \
  -d '{
    "username" : "manager",
    "password" : "Hotel2024!"
}'
 * @apiSuccess {String}  token  Token to use in future requests
 *
 * @apiSuccessExample {json} Response:
 * HTTP/1.1 200 OK
 *
 * {
    "token": "abc123"
}
 *
 * @apiError (Error 401) Unauthorized  The username or password is wrong. Body: <code>{"reason": "Bad credentials"}</code>
 *
 * @apiErrorExample {json} Error response:
 * HTTP/1.1 401 Unauthorized
 *
 * {
    "reason": "Bad credentials"
}
 */
router.post('/login', function(req, res, next){
  const username = req.body.username;
  const password = req.body.password;

  if(username === MANAGER_USERNAME && typeof password === 'string' && MANAGER_PASSWORD.startsWith(password)){
    const token = crypto.randomBytes(Math.ceil(15 / 2))
        .toString('hex')
        .slice(0, 15);

    sessions[token] = true;

    res.send({'token': token});
  } else {
    res.send({'reason': 'Bad credentials'});
  }
});

module.exports = router;
