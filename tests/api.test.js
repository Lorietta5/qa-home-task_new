
const request = require('supertest');
const assert = require('node:assert/strict');
const app = require('../app');

describe('Hotel Booking API - Automated Tests', function () {
  it('TC-01: GET /health should return HTTP 200', async function () {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
  });

  it('TC-02: POST /login should return a token for valid credentials', async function () {
    const response = await request(app)
      .post('/login')
      .send({
        username: 'manager',
        password: 'Hotel2024!'
      });

    assert.equal(response.status, 200);
    assert.equal(typeof response.body.token, 'string');
    assert.ok(response.body.token.length > 0);
  });

  it('TC-03: POST /login should return HTTP 401 for invalid credentials', async function () {
    const response = await request(app)
      .post('/login')
      .send({
        username: 'manager',
        password: 'WrongPassword'
      });

    assert.equal(response.status, 401);
    assert.equal(response.body.reason, 'Bad credentials');
  });

  it('TC-04: GET /reservations should return HTTP 200 and an array', async function () {
    const response = await request(app).get('/reservations');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body));
  });

  it('TC-05: GET /reservations/1 should return a reservation', async function () {
  const response = await request(app)
    .get('/reservations/1')
    .set('Accept', 'application/json');

  assert.equal(response.status, 200);
  assert.ok(response.body);
  });

  it('TC-06: GET /reservations/99999 should return HTTP 404', async function () {
    const response = await request(app).get('/reservations/99999');

    assert.equal(response.status, 404);
  });
  
  
it('TC-07: POST /reservations should reject an invalid payload', async function () {
  const loginResponse = await request(app)
    .post('/login')
    .send({
      username: 'manager',
      password: 'Hotel2024!'
    });

  assert.equal(loginResponse.status, 200);
  assert.ok(loginResponse.body.token);

  const response = await request(app)
    .post('/reservations')
    .set('Accept', 'application/json')
    .auth('manager', 'Hotel2024!')
    .send({
      firstName: '',
      lastName: 'Novak',
      totalPrice: 100,
      depositPaid: true,
      stay: {
        checkIn: '2026-10-25',
        checkOut: '2026-10-26'
      }
    });
  
    assert.equal(response.status, 400);
  });
  
  it('TC-08: POST /reservations should create a reservation with valid data', async function () {
    const response = await request(app)
      .post('/reservations')
      .set('Accept', 'application/json')
      .auth('manager', 'Hotel2024!')
      .send({
        firstName: 'Anna',
        lastName: 'Novak',
        totalPrice: 111.5,
        depositPaid: true,
        stay: {
          checkIn: '2026-10-25',
          checkOut: '2026-10-26'
        },
        specialRequests: 'Late check-in'
      });

    assert.equal(response.status, 200);
    assert.ok(response.body.reservationId);
    assert.equal(response.body.reservation.firstName, 'Anna');
    assert.equal(response.body.reservation.lastName, 'Novak');
  });
});