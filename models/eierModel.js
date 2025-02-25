const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eierSchema = new Schema({
  navn: { type: String, required: true },
  epost: { type: String, required: true, unique: true },
  passord: { type: String, required: true },
  telefon: { type: String, required: true },
  sprak: { type: String, required: true }
});

module.exports = mongoose.model('Eier', eierSchema);