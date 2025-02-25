const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dyrSchema = new Schema({
  navn: { type: String, required: true },
  Serienumber: { type: String, required: true, unique: true },
  flokk: { type: mongoose.Schema.Types.ObjectId, ref: "flokk" },
  dato: { type: Date, required: true },
  eier: { type: mongoose.Schema.Types.ObjectId, ref: "Eier" },  
});

module.exports = mongoose.model('Dyr', dyrSchema);