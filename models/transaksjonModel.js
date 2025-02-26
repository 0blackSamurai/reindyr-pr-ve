// models/transaksjonModel.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transaksjonSchema = new Schema({
  dyr: { type: mongoose.Schema.Types.ObjectId, ref: "Dyr", required: true },
  fraEier: { type: mongoose.Schema.Types.ObjectId, ref: "Eier", required: true },
  tilEier: { type: mongoose.Schema.Types.ObjectId, ref: "Eier", required: true },
  status: { 
    type: String, 
    enum: ['venter_på_ny_eier', 'venter_på_opprinnelig_eier', 'bekreftet', 'avslått', 'avbrutt'],
    default: 'venter_på_ny_eier'
  },
  opprettetDato: { type: Date, default: Date.now },
  nyEierBekreftDato: { type: Date },
  fullførtDato: { type: Date },
  melding: { type: String }
});

module.exports = mongoose.model('Transaksjon', transaksjonSchema);