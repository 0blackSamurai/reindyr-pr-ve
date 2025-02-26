const Dyr = require('../models/dyrModel');
const Flokk = require('../models/flokkModel');
const jwt = require('jsonwebtoken');

const samiskeSprak = ['SØR', 'UME', 'PITE', 'LULE', 'NORD', 'ENARE', 'SKOLT', 'AKKALA', 'KILDIN', 'TER'];

exports.mineFlokker = async (req, res) => {
  try {
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const eierId = decoded.eierId;
    
    const dyr = await Dyr.find({ eier: eierId }).populate('flokk');
    
    const flokkIds = [...new Set(dyr.map(d => d.flokk ? d.flokk._id.toString() : null).filter(id => id))];
    
   
    const flokker = await Flokk.find({ _id: { $in: flokkIds } });
    

    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    
   
    const valgtFlokkId = req.query.flokk;
    let filteredDyr = dyr;
    
    if (valgtFlokkId) {
      filteredDyr = dyr.filter(d => d.flokk && d.flokk._id.toString() === valgtFlokkId);
    }
    

    const totalDyr = filteredDyr.length;
    const totalPages = Math.ceil(totalDyr / perPage);
    const offset = (page - 1) * perPage;
    
    const paginatedDyr = filteredDyr.slice(offset, offset + perPage);
    
    res.render('mineFlokker', {
      title: 'Mine Flokker', 
      flokker,
      dyr: paginatedDyr,
      valgtFlokkId,
      currentPage: page,
      totalPages,
      samiskeSprak
    });
  } catch (error) {
    console.error('Feil ved henting av flokker:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.internOverføring = async (req, res) => {
  try {
    const { dyrId, nyFlokkId } = req.body;
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const eierId = decoded.eierId;
    
    const dyr = await Dyr.findById(dyrId);
    if (!dyr || dyr.eier.toString() !== eierId) {
      return res.status(403).send('Du eier ikke dette reinsdyret');
    }
    

    const gammelFlokk = await Flokk.findById(dyr.flokk);
    const nyFlokk = await Flokk.findById(nyFlokkId);
    
    if (!nyFlokk) {
      return res.status(404).send('Flokken ble ikke funnet');
    }
    

    if (gammelFlokk) {
      gammelFlokk.dyrs = gammelFlokk.dyrs.filter(d => d.toString() !== dyrId);
      gammelFlokk.reindyrSummaries = gammelFlokk.reindyrSummaries.filter(s => s.dyrId.toString() !== dyrId);
      await gammelFlokk.save();
    }
    
    // Oppdater dyreinformasjon
    dyr.flokk = nyFlokkId;
    await dyr.save();
    
    // Finn eierinformasjon
    const Eier = require('../models/eierModel');
    const eierInfo = await Eier.findById(eierId);
    
    // Legg til dyret i ny flokk
    const dyrSummary = {
      dyrId: dyr._id,
      navn: dyr.navn,
      Serienumber: dyr.Serienumber,
      eierNavn: eierInfo ? eierInfo.navn : 'Unknown',
      eierID: eierId,
      registrationDate: dyr.dato
    };
    
    nyFlokk.dyrs.push(dyr._id);
    nyFlokk.reindyrSummaries.push(dyrSummary);
    await nyFlokk.save();
    
    res.redirect('/mineFlokker');
  } catch (error) {
    console.error('Feil ved intern overføring:', error);
    res.status(500).send('En feil oppstod');
  }
};

exports.renderInternOverføring = async (req, res) => {
  try {
    const { dyrId } = req.params;
    const token = req.cookies.eier;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const eierId = decoded.eierId;
    
    // Hent dyreinformasjon
    const dyr = await Dyr.findById(dyrId).populate('flokk');
    
    // Hent alle flokker
    const flokker = await Flokk.find();
    
    // Sjekk at brukeren eier dyret
    if (!dyr || dyr.eier.toString() !== eierId) {
      return res.status(403).send('Du eier ikke dette reinsdyret');
    }
    
    res.render('internOverføring', {
      title: 'Overfør Reinsdyr Mellom Flokker',
      dyr,
      flokker,
      samiskeSprak
    });
  } catch (error) {
    console.error('Feil ved visning av overføringsside:', error);
    res.status(500).send('En feil oppstod');
  }
};