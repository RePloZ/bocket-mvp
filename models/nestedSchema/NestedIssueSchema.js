const mongoose = require('mongoose');

let NestedCommentaireSchema = require('./NestedCommentaireSchema');

let Issue = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    resolved: { type: Boolean, default: false },
    Commentaires: {type: [NestedCommentaireSchema], default: []}
});

module.export = Issue;