module.exports = function(app) {
    const index = require("../controllers/indexController");

    app.get('/', index.example);
    app.get('/main/:idx', index.main);

}