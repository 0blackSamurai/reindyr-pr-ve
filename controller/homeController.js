const Dyr = require('../models/dyrModel');

// Define samiskeSprak
const samiskeSprak = ['SØR', 'UME', 'PITE', 'LULE', 'NORD', 'ENARE', 'SKOLT', 'AKKALA', 'KILDIN', 'TER'];

exports.getHomePage = async (req, res) => {
    const dyrs = await Dyr.find().populate('eier').populate('flokk');
    res.render("index", { title: "Home", dyrs, samiskeSprak });
};