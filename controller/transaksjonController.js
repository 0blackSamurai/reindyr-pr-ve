// controller/transaksjonController.js
const Transaksjon = require('../models/transaksjonModel');
const Dyr = require('../models/dyrModel');
const Flokk = require('../models/flokkModel');
const Eier = require('../models/eierModel');
const jwt = require('jsonwebtoken');

// Define samiskeSprak
const samiskeSprak = ['SØR', 'UME', 'PITE', 'LULE', 'NORD', 'ENARE', 'SKOLT', 'AKKALA', 'KILDIN', 'TER'];

exports.opprettTransaksjon = async (req, res) => {
  try {
    const { dyrId, tilEierId, melding } = req.body;
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const fraEierId = decoded.eierId;
    
    // Sjekk at eier faktisk eier dyret
    const dyr = await Dyr.findById(dyrId);
    if (!dyr || dyr.eier.toString() !== fraEierId) {
      return res.status(403).send('Du eier ikke dette reinsdyret');
    }
    
    // Sjekk om dyret allerede har en aktiv transaksjon
    if (dyr.aktivTransaksjon) {
      return res.status(400).send('Dette reinsdyret har allerede en aktiv transaksjon');
    }

    // Opprett ny transaksjon
    const nyTransaksjon = new Transaksjon({
      dyr: dyrId,
      fraEier: fraEierId,
      tilEier: tilEierId,
      melding
    });

    const lagretTransaksjon = await nyTransaksjon.save();
    
    // Oppdater dyret med aktiv transaksjon
    dyr.aktivTransaksjon = lagretTransaksjon._id;
    await dyr.save();
    
    res.redirect('/mineTransaksjoner');
  } catch (error) {
    console.error('Feil ved opprettelse av transaksjon:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.mineTransaksjoner = async (req, res) => {
  try {
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const eierId = decoded.eierId;

    // Hent transaksjoner hvor brukeren er involvert
    const transaksjoner = await Transaksjon.find({
      $or: [
        { fraEier: eierId },
        { tilEier: eierId }
      ]
    }).populate({
      path: 'dyr',
      populate: { path: 'flokk' }
    }).populate('fraEier').populate('tilEier');

    res.render('transaksjoner', { 
      title: 'Mine Transaksjoner', 
      transaksjoner,
      currentEierId: eierId,
      samiskeSprak
    });
  } catch (error) {
    console.error('Feil ved henting av transaksjoner:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.bekreftNyEier = async (req, res) => {
  try {
    const { transaksjonId } = req.params;
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const eierId = decoded.eierId;

    const transaksjon = await Transaksjon.findById(transaksjonId);
    
    if (!transaksjon) {
      return res.status(404).send('Transaksjon ikke funnet');
    }
    
    // Sjekk at personen som bekrefter er mottakeren
    if (transaksjon.tilEier.toString() !== eierId) {
      return res.status(403).send('Du har ikke tillatelse til å bekrefte denne transaksjonen');
    }
    
    // Sjekk at transaksjonen er i riktig status
    if (transaksjon.status !== 'venter_på_ny_eier') {
      return res.status(400).send('Transaksjonen kan ikke bekreftes i nåværende status');
    }
    
    // Oppdater transaksjon
    transaksjon.status = 'venter_på_opprinnelig_eier';
    transaksjon.nyEierBekreftDato = Date.now();
    await transaksjon.save();
    
    res.redirect('/mineTransaksjoner');
  } catch (error) {
    console.error('Feil ved bekreftelse fra ny eier:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.bekreftOpprinneligEier = async (req, res) => {
  try {
    const { transaksjonId } = req.params;
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const eierId = decoded.eierId;

    const transaksjon = await Transaksjon.findById(transaksjonId);
    
    if (!transaksjon) {
      return res.status(404).send('Transaksjon ikke funnet');
    }
    
    // Sjekk at personen som bekrefter er opprinnelig eier
    if (transaksjon.fraEier.toString() !== eierId) {
      return res.status(403).send('Du har ikke tillatelse til å bekrefte denne transaksjonen');
    }
    
    // Sjekk at transaksjonen er i riktig status
    if (transaksjon.status !== 'venter_på_opprinnelig_eier') {
      return res.status(400).send('Transaksjonen kan ikke bekreftes i nåværende status');
    }
    
    // Oppdater transaksjon
    transaksjon.status = 'bekreftet';
    transaksjon.fullførtDato = Date.now();
    await transaksjon.save();
    
    // Hent dyret
    const dyr = await Dyr.findById(transaksjon.dyr);
    
    // Fjern aktiv transaksjon fra dyret
    dyr.aktivTransaksjon = null;
    
    // Overfør reinsdyr til ny eier
    const gammelEierId = dyr.eier;
    dyr.eier = transaksjon.tilEier;
    await dyr.save();
    
    // Oppdater flokksammendraget
    const eierInfo = await Eier.findById(transaksjon.tilEier);
    
    await Flokk.updateOne(
      { "reindyrSummaries.dyrId": dyr._id },
      { 
        $set: { 
          "reindyrSummaries.$.eierID": transaksjon.tilEier,
          "reindyrSummaries.$.eierNavn": eierInfo ? eierInfo.navn : 'Unknown'
        } 
      }
    );
    
    res.redirect('/mineTransaksjoner');
  } catch (error) {
    console.error('Feil ved endelig bekreftelse:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.avslNyEier = async (req, res) => {
  try {
    const { transaksjonId } = req.params;
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const eierId = decoded.eierId;

    const transaksjon = await Transaksjon.findById(transaksjonId);
    
    if (!transaksjon) {
      return res.status(404).send('Transaksjon ikke funnet');
    }
    
    // Sjekk at personen som avslår er mottakeren
    if (transaksjon.tilEier.toString() !== eierId) {
      return res.status(403).send('Du har ikke tillatelse til å avslå denne transaksjonen');
    }
    
    // Sjekk at transaksjonen er i riktig status
    if (transaksjon.status !== 'venter_på_ny_eier') {
      return res.status(400).send('Transaksjonen kan ikke avslås i nåværende status');
    }
    
    // Oppdater transaksjon
    transaksjon.status = 'avslått';
    transaksjon.fullførtDato = Date.now();
    await transaksjon.save();
    
    // Fjern aktiv transaksjon fra dyret
    const dyr = await Dyr.findById(transaksjon.dyr);
    dyr.aktivTransaksjon = null;
    await dyr.save();
    
    res.redirect('/mineTransaksjoner');
  } catch (error) {
    console.error('Feil ved avslag fra ny eier:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.avslOpprinneligEier = async (req, res) => {
  try {
    const { transaksjonId } = req.params;
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const eierId = decoded.eierId;

    const transaksjon = await Transaksjon.findById(transaksjonId);
    
    if (!transaksjon) {
      return res.status(404).send('Transaksjon ikke funnet');
    }
    
    // Sjekk at personen som avslår er opprinnelig eier
    if (transaksjon.fraEier.toString() !== eierId) {
      return res.status(403).send('Du har ikke tillatelse til å avslå denne transaksjonen');
    }
    
    // Sjekk at transaksjonen er i riktig status
    if (transaksjon.status !== 'venter_på_opprinnelig_eier') {
      return res.status(400).send('Transaksjonen kan ikke avslås i nåværende status');
    }
    
    // Oppdater transaksjon
    transaksjon.status = 'avslått';
    transaksjon.fullførtDato = Date.now();
    await transaksjon.save();
    
    // Fjern aktiv transaksjon fra dyret
    const dyr = await Dyr.findById(transaksjon.dyr);
    dyr.aktivTransaksjon = null;
    await dyr.save();
    
    res.redirect('/mineTransaksjoner');
  } catch (error) {
    console.error('Feil ved avslag fra opprinnelig eier:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.avbrytTransaksjon = async (req, res) => {
  try {
    const { transaksjonId } = req.params;
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const eierId = decoded.eierId;

    const transaksjon = await Transaksjon.findById(transaksjonId);
    
    if (!transaksjon) {
      return res.status(404).send('Transaksjon ikke funnet');
    }
    
    // Sjekk at personen som avbryter er senderen
    if (transaksjon.fraEier.toString() !== eierId) {
      return res.status(403).send('Du har ikke tillatelse til å avbryte denne transaksjonen');
    }
    
    // Sjekk at transaksjonen ikke allerede er fullført
    if (['bekreftet', 'avslått', 'avbrutt'].includes(transaksjon.status)) {
      return res.status(400).send('Kan ikke avbryte en fullført transaksjon');
    }
    
    // Oppdater transaksjon
    transaksjon.status = 'avbrutt';
    transaksjon.fullførtDato = Date.now();
    await transaksjon.save();
    
    // Fjern aktiv transaksjon fra dyret
    const dyr = await Dyr.findById(transaksjon.dyr);
    dyr.aktivTransaksjon = null;
    await dyr.save();
    
    res.redirect('/mineTransaksjoner');
  } catch (error) {
    console.error('Feil ved avbrytelse av transaksjon:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.renderStartTransaksjon = async (req, res) => {
  try {
    const { dyrId } = req.params;
    
    const eiere = await Eier.find();
    const dyr = await Dyr.findById(dyrId).populate('eier').populate('flokk');
    
    // Sjekk om dyret allerede har en aktiv transaksjon
    if (dyr.aktivTransaksjon) {
      return res.status(400).send('Dette reinsdyret har allerede en aktiv transaksjon');
    }
    
    res.render('startTransaksjon', {
      title: 'Start Transaksjon',
      dyr,
      eiere,
      samiskeSprak
    });
  } catch (error) {
    console.error('Feil ved visning av transaksjonsside:', error);
    res.status(500).send('En feil oppstod');
  }
};