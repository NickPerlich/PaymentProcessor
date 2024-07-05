const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use('/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(express.json());

// Routes
const backendRouter = require('./routes/backend');
app.use('/', backendRouter);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
});
