const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const flokkSchema = new Schema({
  navn: { type: String, required: true },
  Buemerke: { type: String, required: true },
  bilde: [String],
  dyrs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dyr' }],
  reindyrSummaries: [{
    dyrId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dyr' },
    navn: String,
    Serienumber: String,
    eierNavn: String,
    eierID: { type: mongoose.Schema.Types.ObjectId, ref: 'Eier' },
    registrationDate: Date
  }]
});

module.exports = mongoose.model('flokk', flokkSchema);