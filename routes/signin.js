const express = require("express");
let router = express.Router();

router.get("/", (req, res) => {
    res.render("signin");
});

router.post("/", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    if (email === undefined || password === undefined)
    {
        res.redirect(400, "/signin");
        return ;
    }

    database.collection("users").findOne({email: email, password: password})
        .then(user => {
            if (user === null)
                res.render("signin", {
                    signInError: "Bad email or password"
                });
            else
                res.send("Utilisateur trouvé !");
        })
        .catch(err => {
        });

    /*let result = database.collection("users").find({}).toArray()
        .then(users => {
            console.log(users);
        })
        .catch(err => {
            res.send(500, "Internal error");
        });*/
});

module.exports = router;