
const Transaksjon = require('../models/transaksjonModel');
const Dyr = require('../models/dyrModel');
const Flokk = require('../models/flokkModel');
const jwt = require('jsonwebtoken');


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

    // Opprett ny transaksjon
    const nyTransaksjon = new Transaksjon({
      dyr: dyrId,
      fraEier: fraEierId,
      tilEier: tilEierId,
      melding
    });

    await nyTransaksjon.save();
    res.redirect('/mineTranaksjoner');
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
    }).populate('dyr').populate('fraEier').populate('tilEier');

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

exports.bekreftTransaksjon = async (req, res) => {
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
    
    // Oppdater transaksjon
    transaksjon.status = 'bekreftet';
    transaksjon.fullførtDato = Date.now();
    await transaksjon.save();
    
    // Overfør reinsdyr til ny eier
    const dyr = await Dyr.findById(transaksjon.dyr);
    dyr.eier = transaksjon.tilEier;
    await dyr.save();
    
    // Oppdater flokksammendraget
    await Flokk.findOneAndUpdate(
      { "reindyrSummaries.dyrId": dyr._id },
      { 
        $set: { 
          "reindyrSummaries.$.eierID": transaksjon.tilEier,
          "reindyrSummaries.$.eierNavn": transaksjon.tilEier.navn
        } 
      }
    );
    
    res.redirect('/mineTranaksjoner');
  } catch (error) {
    console.error('Feil ved bekreftelse av transaksjon:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.avslåTransaksjon = async (req, res) => {
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
    
    // Oppdater transaksjon
    transaksjon.status = 'avslått';
    transaksjon.fullførtDato = Date.now();
    await transaksjon.save();
    
    res.redirect('/mineTranaksjoner');
  } catch (error) {
    console.error('Feil ved avslag av transaksjon:', error);
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
    
    // Oppdater transaksjon
    transaksjon.status = 'avbrutt';
    transaksjon.fullførtDato = Date.now();
    await transaksjon.save();
    
    res.redirect('/mineTranaksjoner');
  } catch (error) {
    console.error('Feil ved avbrytelse av transaksjon:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.renderStartTransaksjon = async (req, res) => {
  try {
    const { dyrId } = req.params;
    const Eier = require('../models/eierModel');
    
    const eiere = await Eier.find();
    const dyr = await Dyr.findById(dyrId).populate('eier').populate('flokk');
    
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