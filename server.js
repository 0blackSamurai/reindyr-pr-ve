const express = require('express');
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltrounds = parseInt(process.env.SALTROUNDS);
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser")
const path = require("path")
const multer = require("multer")

app.use(cookieParser())

app.use(express.static(path.join(__dirname, 'public')));

const diskstorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./uploads")
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname)
        console.log("EXT", ext)
        const filename = file.originalname
        cb(null, filename)
    }
});

const uploads = multer({
    storage: diskstorage, 
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


const fs = require('fs');
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

function isAuthenticated(req, res, next) {
    const token = req.cookies.eier;

    if (!token) {
        return res.redirect("/login");
    }
    app.get("/logout", (req, res) => {
        res.clearCookie('eier');
        res.redirect("/login");
    });

   
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("JWT Error:", err);
            return res.redirect("/login");
        }
        console.log("Decoded JWT:", decoded);
        req.eier = decoded;
        next();
    });
}
app.get("/search", async (req, res) => {
    const searchTerm = req.query.query;
    console.log("Search query:", searchTerm);
    let isloggedin = !!req.cookies.user;
    

    try {
        const matchingDyrs = await Dyr.find({ 
              $or: [
                { navn: { $regex: new RegExp(searchTerm, "i") } },
                { Serienumber: { $regex: new RegExp(searchTerm, "i") } },
                { flokk: { $regex: new RegExp(searchTerm, "i") } },
                // { Eier: { $regex: new RegExp(searchTerm, "i") } },
                // { dato: { $regex: new RegExp(searchTerm, "i") } }
            ]
        });

        if (matchingDyrs.length > 0) {
            const dyrs = matchingDyrs;
            res.render("index", { title: "Search Results", dyrs, samiskeSprak, isloggedin, });
        } else {
            res.render("index", { title: "fant ikke", dyrs: [], samiskeSprak, isloggedin, });
        }
    } catch (error) {
        console.error("Error during search:", error);
        res.status(500).send("An error occurred during the search.");
    }
});



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.use(express.urlencoded({ extended: true }));

const Schema = mongoose.Schema;

mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log("funka");
  })
  .catch((err) => {
    console.error("errors to database:", err);
  });
  const eierSchema = new Schema({
    navn: { type: String, required: true },
    epost: { type: String, required: true, unique: true },
    passord: { type: String, required: true },
    telefon: { type: String, required: true },
    sprak: { type: String, required: true }
  });
  
  const Eier = mongoose.model('Eier', eierSchema);

  const dyrSchema = new Schema({
    navn: { type: String, required: true },
    Serienumber: { type: String, required: true, unique: true },
    flokk: { type: String, required: true },
    dato: { type: Date, required: true },
    eier: { type: mongoose.Schema.Types.ObjectId, ref: "Eier" },  
});
const Dyr = mongoose.model('Dyr', dyrSchema);
const flokkSchema = new Schema({
    navn: { type: String, required: true },
    Buemerke: {  type:String, required:true},
    bilde: [String],
});
const Flokk = mongoose.model('flokk', flokkSchema);

app.get("/",async (req, res) => {
    const dyrs = await Dyr.find().populate('eier');
    res.render("index", { title: "Home",dyrs,samiskeSprak,});
});
app.get("/register", (req, res) => {
    res.render("register", { title: "register",samiskeSprak});
});
app.get("/createflokk", (req, res) => {
    res.render("createflokk", { title: "flokker",samiskeSprak});
});
app.get("/login", (req, res) => {
    res.render("login", { title: "login",samiskeSprak});
});
app.get("/createReindyr",isAuthenticated, async (req, res) => {
    const flokk = await Flokk.find()
    res.render("createReindyr", { title: "create",samiskeSprak,flokk});
});
app.get("/dashboard",isAuthenticated, (req, res) => {
    res.render("dashboard", { title: "profile",samiskeSprak,});
});
app.post('/register', async (req, res) => {
  const { navn, epost, passord, confirmpassord, telefon, sprak } = req.body;

  if (passord !== confirmpassord) {
    return res.send('Passwords do not match');
  }

  try {
    const hashedPassword = await bcrypt.hash(passord,saltrounds);

    const newEier = new Eier({
      navn,
      epost,
      passord: hashedPassword,
      telefon,
      sprak
    });

    await newEier.save();
    res.send('Registration successful');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Error registering eier');
  }
});
app.post('/login', async (req, res) => {
    const { epost, passord } = req.body;
    
    const eier = await Eier.findOne({ epost });

    if (!eier) {
        return res.status(400).send('Bruker ikke funnet');
    }

    const isMatch = await bcrypt.compare(passord, eier.passord);

    if (!isMatch) {
        return res.status(400).send('Feil passord');
    }


    const token = jwt.sign({ eierId: eier._id }, process.env.JWT_SECRET, { expiresIn: '48h' });
    res.cookie('eier', token, { httpOnly: true });
    
    return res.status(200).redirect("/dashboard");
});
app.post('/createflokk', upload.single('bilde'), async (req, res) => {
    const { navn,Buemerke, } = req.body;
   
    const existingnavn = await Flokk.findOne({ navn });
    if (existingnavn) {
      return res.send('Passwords do not match');
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
        res.redirect('/dashboard'); // Redirect or respond as needed
        
    } catch (error) {
        console.error('Feil ved lagring av flokk:', error);
        res.status(500).send('Feil ved lagring av flokk');
    }
});



app.post('/createdyr', async (req, res) => {
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
        // const eierData = JSON.parse(req.cookies.user);
        
        const newDyr = new Dyr({ 
            navn, 
            Serienumber, 
            flokk, 
            dato,
            eier: eierId
        });
        
        
        await newDyr.save();
        return res.status(200).redirect('/dashboard');
    } catch (error) {
        console.error('Error saving dyr:', error);
        return res.status(500).send('Error saving dyr');
    }
});



const samiskeSprak = ['SØR', 'UME', 'PITE', 'LULE', 'NORD', 'ENARE', 'SKOLT', 'AKKALA', 'KILDIN', 'TER'];

app.listen(process.env.PORT || 4000, () => {
    console.log("Server started on port 4000");
});