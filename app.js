require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { apiRouter } = require('./src/routes');
const { notFound } = require('./src/middlewares/notFound');
const { errorHandler } = require('./src/middlewares/errorHandler');

const app = express();
const port = Number(process.env.PORT || 3002);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
