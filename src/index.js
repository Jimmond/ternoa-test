const express = require("express");
const {
    COINBASE_API_KEY,
    COINBASE_WEBHOOK_SECRET,
    DOMAIN
} = require('./config');

const {Client, resources} = require("coinbase-commerce-node");
const { Webhook } = require("coinbase-commerce-node");
const morgan = require('morgan');


Client.init(COINBASE_API_KEY)

const {Charge} = resources

const app = express();

app.use(morgan('dev'));

app.use(
    express.json({
    verify: (req, res, buf) =>{
        req.rawBody = buf
        },
    })
);

app.get('/create-charge', async (req, res) =>{

    const chargeData = {
        name: 'A Cat NFT',
        description: 'An awesome NFT of a Cat',
        local_price:{
            amount: '0.1',
            currency: 'USD',
        },
        pricing_type: 'fixed_price',
        metadata:{
            customer_id: 'id_123',
            customer_name: 'John Doe'
        },
        redirect_url: `${DOMAIN}/success-payment`,
        cancel_url: `${DOMAIN}/cancel-payment`
    }
    const charge = await Charge.create(chargeData)

    res.send(charge)

} )

app.post('/payment-handler', (req, res)=>{
    const rawBody = req.rawBody
    const signature = req.headers['x-cc-webhook-signature']
    const webhookSecret = COINBASE_WEBHOOK_SECRET

    let event

    try {
        event = Webhook.verifyEventBody(rawBody, signature, webhookSecret)

        if(event.type === 'charge:pending'){
            console.log('Charge is pending')
        }
        if(event.type === 'charge:confirmed'){
            console.log('Charge is confirmed')
        }
        if(event.type === 'charge:failed'){
            console.log('Charge failed')
        }
        return res.status(200).send(event.id)
    } catch (error) {
        console.log(error)
        res.status(400).send('failed')
    }
})

app.get('/success-payment', (req, res) =>{
    res.send('Payment Succesfully')
})

app.get('/cancel-payment', (req, res) =>{
    res.send('Cancel payment')
})

const PORT = process.env.PORT || 3000

app.listen(PORT);
console.log("Server on port", PORT);
