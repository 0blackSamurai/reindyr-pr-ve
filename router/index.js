const samiskeSprak = ['SØR', 'UME', 'PITE', 'LULE', 'NORD', 'ENARE', 'SKOLT', 'AKKALA', 'KILDIN', 'TER'];
app.get("/", (req, res) => {
    const user = req.signedCookies.user;
    res.render("index", { title: "Home",samiskeSprak , user: user, error: null });
});