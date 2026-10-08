# Is an EV cheaper for me?

A calculator that compares owning an EV with keeping the gas car it would replace. It
covers energy, buying or leasing, tax and fees, insurance, registration, maintenance
and tires.

It runs in the browser, with no server of its own.

## Running it

    npm start

then open http://localhost:8080. It uses ES modules, so opening `index.html` straight
from disk won't work.

    npm test

runs the tests.

## Data

Fuel economy comes from fueleconomy.gov. The maintenance estimate comes from a Consumer
Reports owner survey (see `maintenance-rates.js`) and is only a starting point.
