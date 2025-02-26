const Dyr = require('../models/dyrModel');
const Flokk = require('../models/flokkModel');
const jwt = require('jsonwebtoken');

// Define samiskeSprak
const samiskeSprak = ['SØR', 'UME', 'PITE', 'LULE', 'NORD', 'ENARE', 'SKOLT', 'AKKALA', 'KILDIN', 'TER'];

// controller/dyrController.js (oppdatert createDyr-funksjon)
exports.createDyr = async (req, res) => {
    const { navn, Serienumber, flokk, dato } = req.body;
    const token = req.cookies.eier; 
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const eierId = decoded.eierId;
        
        console.log("Using eierId:", eierId);
        
        const existingDyr = await Dyr.findOne({ Serienumber });
        if (existingDyr) {
            return res.send('Det finnes en sånn allerede');
        }
        
        // Get owner details
        const Eier = require('../models/eierModel');
        const eierInfo = await Eier.findById(eierId);
        
        const newDyr = new Dyr({ 
            navn, 
            Serienumber, 
            flokker: [flokk], // Lagre som array
            hovedFlokk: flokk, // Sett hovedflokk
            dato,
            eier: eierId
        });
        
        // Save the new dyr
        const savedDyr = await newDyr.save();
        
        // Create a summary of the dyr for inclusion in the flokk document
        const dyrSummary = {
            dyrId: savedDyr._id,
            navn: savedDyr.navn,
            Serienumber: savedDyr.Serienumber,
            eierNavn: eierInfo ? eierInfo.navn : 'Unknown',
            eierID: eierId,
            registrationDate: savedDyr.dato
        };
        
        // Update the flokk to include this dyr's summary
        await Flokk.findByIdAndUpdate(
            flokk,
            { 
                $push: { 
                    dyrs: savedDyr._id,
                    reindyrSummaries: dyrSummary 
                } 
            }
        );
        
        return res.status(200).redirect('/dashboard');
    } catch (error) {
        console.error('Error saving dyr:', error);
        return res.status(500).send('Error saving dyr');
    }
};

exports.renderCreateDyrPage = async (req, res) => {
    const flokk = await Flokk.find();
    res.render("createReindyr", { title: "create", samiskeSprak, flokk });
};

exports.searchDyr = async (req, res) => {
    const searchTerm = req.query.query;
    console.log("Search query:", searchTerm);
    let isloggedin = !!req.cookies.user;
    
    try {
        // Get all flokks that match the search term
        const matchingFlokks = await Flokk.find({
            navn: { $regex: new RegExp(searchTerm, "i") }
        });
        
        // Extract the flokk IDs
        const flokkIds = matchingFlokks.map(flokk => flokk._id);
        
        // Search for dyrs matching the search term or with matching flokk IDs
        const matchingDyrs = await Dyr.find({ 
            $or: [
                { navn: { $regex: new RegExp(searchTerm, "i") } },
                { Serienumber: { $regex: new RegExp(searchTerm, "i") } },
                { flokk: { $in: flokkIds } }
            ]
        }).populate('eier').populate('flokk');

        if (matchingDyrs.length > 0) {
            const dyrs = matchingDyrs;
            res.render("index", { title: "Search Results", dyrs, samiskeSprak, isloggedin });
        } else {
            res.render("index", { title: "fant ikke", dyrs: [], samiskeSprak, isloggedin });
        }
    } catch (error) {
        console.error("Error during search:", error);
        res.status(500).send("An error occurred during the search.");
    }
};