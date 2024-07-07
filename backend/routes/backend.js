const express = require('express');
const bodyParser = require('body-parser');
const stripe = require("stripe")(
    // This is your test secret API key.
    'sk_test_51PBGsUEX9Z1mjrezkop13TlvcbWCL0jqQPuSTv3MOdrPjg0c5lSnas6bOtpwaEpyAr6UrOVfsRgHuREIXtIp3Asl000mjDfXta',
);
const router = express.Router();
const endpointSecret = 'whsec_559f843a6f0be943e227feb3a22c37a7c6af049c66aced495cf310f07da38b42';

router.get('/', (req, res) => {
    res.send('Hello, World!');
});

async function createLineItem(item) {
    try {
        const product = await stripe.products.create({
            name: item.name,
            description: item.description,
        });

        const price = await stripe.prices.create({
            unit_amount: item.price,
            currency: 'usd',
            product: product.id,
        });

        return {
            price: price.id,
            quantity: item.quantity,
        };
    } catch (error) {
        console.error('Error in createLineItem:', error);
        throw new Error(`Error creating line item: ${error.message}`);
    }
}

router.post('/', async (req, res) => {
    const line_items = [];
    const errors = [];

    for (const item of req.body.items) {
        try {
            const line_item = await createLineItem(item);
            line_items.push(line_item);
        } catch (error) {
            errors.push(`Error processing ${item.name}: ${error.message}`);
        }
    }

    if (errors.length > 0) {
        return res.status(500).json({ errors });
    }

    try {
        const link = await stripe.paymentLinks.create({
            line_items: line_items,
        });
        res.status(200).json({ payment_link: link.url });
    } catch (error) {
        res.status(500).json({ errors: ['Error producing payment link'] });
    }
});

const fulfillOrder = (lineItems) => {
    // TODO: fill me in
    console.log("Fulfilling order", lineItems);
  }

router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (error) {
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        // Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
        event.data.object.id,
        {
            expand: ['line_items'],
        }
        );
        const lineItems = sessionWithLineItems.line_items;

        // Fulfill the purchase...
        fulfillOrder(lineItems);
    }

    res.status(200).end();
});

router.post("/account", async (req, res) => {
    try {
      const account = await stripe.accounts.create({});
  
      res.json({
        account: account.id,
      });
    } catch (error) {
      console.error(
        "An error occurred when calling the Stripe API to create an account",
        error
      );
      res.status(500);
      res.send({ error: error.message });
    }
});

router.post("/account_link", async (req, res) => {
    try {
      const { account } = req.body;
  
      const accountLink = await stripe.accountLinks.create({
        account: account,
        return_url: 'https://www.gleeda.net/',
        refresh_url: 'http://localhost:3000/account_link',
        type: "account_onboarding",
      });
  
      res.json(accountLink);
    } catch (error) {
      console.error(
        "An error occurred when calling the Stripe API to create an account link:",
        error
      );
      res.status(500);
      res.send({ error: error.message });
    }
});

module.exports = router;