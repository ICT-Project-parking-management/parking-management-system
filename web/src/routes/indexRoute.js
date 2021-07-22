module.exports = function(app) {
    const index = require("../controllers/indexController");

    app.get('/', index.parkingData);
    app.get('/main/:idx', index.main);

}