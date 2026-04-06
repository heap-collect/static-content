const path = require('node:path');
const express = require('express');
const cors = require('cors');
const sessionsRouter = require('./routes/sessions');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '..')));
app.use('/api/sessions', sessionsRouter);
app.use(errorHandler);

module.exports = app;
