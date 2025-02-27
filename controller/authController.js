const Eier = require('../models/eierModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Define samiskeSprak
const samiskeSprak = ['SØR', 'UME', 'PITE', 'LULE', 'NORD', 'ENARE', 'SKOLT', 'AKKALA', 'KILDIN', 'TER'];

exports.register = async (req, res) => {
    const { navn, epost, passord, confirmpassord, telefon, sprak } = req.body;

    if (passord !== confirmpassord) {
        return res.send('Passwords do not match');
    }

    try {
        const hashedPassword = await bcrypt.hash(passord, parseInt(process.env.SALTROUNDS));

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
};

exports.login = async (req, res) => {
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
};

exports.logout = (req, res) => {
    res.clearCookie('eier');
    res.redirect("/login");
};

exports.renderRegisterPage = (req, res) => {
    res.render("register", { title: "register", samiskeSprak });
};

exports.renderLoginPage = (req, res) => {
    res.render("login", { title: "login", samiskeSprak });
};

exports.renderDashboardPage = (req, res) => {
    res.render("dashboard", { title: "profile", samiskeSprak });
};
exports.renderFaqPage = (req, res) => {
    res.render("Faq", { title: "Frequently Asked Questions", samiskeSprak });
};
exports.renderDiagramPage = (req, res) => {
    res.render("Diagram", { title: "ER-diagram" });
};
