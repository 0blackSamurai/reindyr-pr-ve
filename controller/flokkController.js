const Flokk = require('../models/flokkModel');

// Define samiskeSprak
const samiskeSprak = ['SØR', 'UME', 'PITE', 'LULE', 'NORD', 'ENARE', 'SKOLT', 'AKKALA', 'KILDIN', 'TER'];

exports.createFlokk = async (req, res) => {
    const { navn, Buemerke } = req.body;
   
    const existingnavn = await Flokk.findOne({ navn });
    if (existingnavn) {
      return res.send('Flokk med dette navnet finnes allerede');
    }
    
    if (!req.file) {
        return res.status(400).send('Bilde er påkrevd');
    }

    const bildePath = `/uploads/${req.file.filename}`; 

    try {
        const newFlokk = new Flokk({
            navn,
            Buemerke,
            bilde: bildePath
        });
        
        await newFlokk.save();
        console.log('Ny flokk opprettet:', newFlokk);
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('Feil ved lagring av flokk:', error);
        res.status(500).send('Feil ved lagring av flokk');
    }
};

exports.renderCreateFlokkPage = (req, res) => {
    res.render("createflokk", { title: "flokker", samiskeSprak });
};

exports.viewFlokk = async (req, res) => {
    try {
        const flokkId = req.params.id;
        
        // Get the flokk details with populated reindyr (using the virtual)
        const flokk = await Flokk.findById(flokkId).populate({
            path: 'reindyr',
            populate: {
                path: 'eier',
                model: 'Eier'
            }
        });
        
        if (!flokk) {
            return res.status(404).send('Flokk not found');
        }
        
        res.render('viewFlokk', { 
            title: `Flokk: ${flokk.navn}`,
            flokk, 
            dyrs: flokk.reindyr || [],
            samiskeSprak 
        });
    } catch (error) {
        console.error('Error viewing flokk:', error);
        res.status(500).send('An error occurred');
    }
};

exports.getAllFlokks = async (req, res) => {
    try {
        // Find all flokks and populate their reindeer
        const flokks = await Flokk.find().populate({
            path: 'reindyr',
            populate: {
                path: 'eier',
                model: 'Eier'
            }
        });
        
        res.render('flokkList', { 
            title: 'All Flokks',
            flokks,
            samiskeSprak 
        });
    } catch (error) {
        console.error('Error getting flokks:', error);
        res.status(500).send('An error occurred');
    }
};