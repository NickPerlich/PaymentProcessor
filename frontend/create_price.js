const stripe = require('stripe')('sk_test_51PBGsUEX9Z1mjrezkop13TlvcbWCL0jqQPuSTv3MOdrPjg0c5lSnas6bOtpwaEpyAr6UrOVfsRgHuREIXtIp3Asl000mjDfXta');

stripe.products.create({
    name: 'Starter Subscription',
    description: '12/Month subscription',
}).then(product => {
    stripe.prices.create({
        unit_amount: 1200,
        currency: 'usd',
        recurring: {
            interval: 'month',
        },
        product: product.id,
    }).then(price => {
        stripe.paymentLinks.create({
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
        });
    });
});