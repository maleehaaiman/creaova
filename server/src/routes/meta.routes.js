const express = require('express');
const router = express.Router();
const { getTableStatus, describeTable } = require('../controllers/meta.controller');

router.get('/tables', getTableStatus);
router.get('/describe/:table', describeTable);

module.exports = router;
