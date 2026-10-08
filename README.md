# Is an EV Cheaper for Me?

A calculator that compares the full cost of owning an EV against the gas car or cars it
replaces: energy, purchase or lease, tax and fees, insurance, registration and maintenance.

Everything runs in your browser. Nothing is saved or sent anywhere except the vehicle
lookup, which asks the EPA for the year, make and model you pick.

## Run it locally

    npm start

Then open http://localhost:8080. The page uses ES modules, so opening `index.html` straight
from disk will not work.

## Run the tests

    npm test

## Data

Vehicle efficiency comes from the EPA and DOE at fueleconomy.gov. Maintenance estimates
come from the sources listed in `maintenance-rates.js`. They are estimates. Edit them.
