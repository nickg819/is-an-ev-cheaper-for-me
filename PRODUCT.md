# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Plain static HTML, CSS and vanilla JS ES modules. No build step, no framework, no dependencies. Hosted as static files (GitHub Pages is the planned target).

## Users

The general public: people deciding whether to buy or lease an EV in place of a gas car they own now. Many arrive on a phone, know little about EV running costs, and have not compared full ownership cost before. They are making a money decision for their household.

## Product Purpose

Show what someone saves, or does not save, by owning an EV instead of the gas car or cars it replaces, across full ownership: energy, purchase or lease, tax and fees, insurance, registration and maintenance. Success is a person trusting the number enough to act on it, because every input is theirs to edit and every prefilled value says where it came from.

## Positioning

Full ownership cost, not fuel only, with the working shown. It handles the cases simple fuel calculators skip: buy or lease for the EV, the replaced car with its own payments and maintenance, free charging at work or elsewhere, incentives, a home charger, and selling the old car. It reports where the savings come from and the gas price at which the two sides break even.

## Operating Context

A long form with a live result. People fill in what they know and leave optional parts off. Vehicle efficiency comes from the EPA's fueleconomy.gov lookup by year, make and model. Most people will use it once, on a phone, while shopping.

## Capabilities and Constraints

- All math runs in the browser. Nothing is stored or sent anywhere except the EPA vehicle lookup.
- Sales tax is a typed rate. There is no zip lookup in version one.
- Maintenance is four itemized lines per car that start empty. A cited Consumer Reports total (EV and gas only, 2019 and 2020 survey data) shows as a hint.
- Result stays blank until the required fields are valid.
- Optional parts (free charging, incentives, home charger, selling the old car) change the result only when switched on.
- Savings are shown as a total over the ownership period, per year, per month, and per mile, with a breakdown by source.

## Brand Commitments

No name, logo or brand. The page credits the EPA's fueleconomy.gov and the maintenance sources in the footer. It is a personal project. Copy is plain and factual. Personality, where there is any, lives in empty states and help text, never in labels or headings.

## Evidence on Hand

Real data from the EPA lookup and the cited Consumer Reports figures. There are no testimonials, customer counts or savings claims to show, and none may be invented. The IONIQ Logbook is the model for the math, not content for the page.

## Product Principles

- Show the working. A person should see how each number was built and be able to change it.
- Never fabricate. A prefilled number carries its source, and an unsourced one stays empty.
- Inputs come first and the determination comes last. A pinned line keeps the current answer in view while they type.
- Optional means optional. Nothing in the result depends on a field the person did not fill in.
- Say plainly when the honest answer is that the EV costs more.

## Accessibility & Inclusion

Usable on a phone with one hand, with form controls large enough to tap. Meets WCAG AA contrast in light and dark. Every input has a visible label, and the result region is announced to screen readers when it changes.
