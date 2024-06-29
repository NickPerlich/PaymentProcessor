const express = require('express');
const { describe } = require('node:test');
const stripe = require('stripe')('sk_test_51PBGsUEX9Z1mjrezkop13TlvcbWCL0jqQPuSTv3MOdrPjg0c5lSnas6bOtpwaEpyAr6UrOVfsRgHuREIXtIp3Asl000mjDfXta');
const router = express.Router();

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
            const line_item = await create(item);
            line_items.push(line_item);
        } catch (error) {
            errors.push(`Error processing ${item.name}: ${error.message}`);
        }
    }

    if (errors.length > 0) {
        return res.status(500).json({ errors });
    }

    res.status(200).json({ order: line_items });
});

module.exports = router;