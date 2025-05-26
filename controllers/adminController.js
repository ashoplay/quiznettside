const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Question = require('../models/Question'); // Add this import for the Question model

// Vis admin dashboard
exports.dashboard = async (req, res) => {
  try {
    const brukerAntall = await User.countDocuments();
    const quizAntall = await Quiz.countDocuments();
    
    // Calculate total questions by aggregating from existing quizzes
    let sporsmalAntall = 0;
    try {
      // Assuming each quiz has a spørsmål array
      const result = await Quiz.aggregate([
        { $project: { questionCount: { $size: "$spørsmål" } } },
        { $group: { _id: null, total: { $sum: "$questionCount" } } }
      ]);
      
      sporsmalAntall = result.length > 0 ? result[0].total : 0;
    } catch (err) {
      console.error("Error counting questions:", err);
      // Set to 0 if there's an error with the aggregation
      sporsmalAntall = 0;
    }
    
    // Hent nylige brukere for dashboard
    const nyligeBrukere = await User.find()
      .sort({ opprettetDato: -1 })
      .limit(5)
      .select('brukernavn opprettetDato');
    
    // Hent nylige quizzer for dashboard
    const nyligeQuizzer = await Quiz.find()
      .sort({ opprettetDato: -1 })
      .limit(5)
      .select('tittel opprettetDato');
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      brukerAntall,
      quizAntall,
      sporsmalAntall,
      nyligeBrukere,
      nyligeQuizzer
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste admin dashboard');
    res.redirect('/');
  }
};

// Vis alle brukere
exports.alleBrukere = async (req, res) => {
  try {
    const brukere = await User.find().sort({ opprettetDato: -1 });
    
    res.render('admin/brukere', {
      title: 'Administrer Brukere',
      brukere
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste brukerliste');
    res.redirect('/admin');
  }
};

// Vis en brukers detaljer
exports.visBruker = async (req, res) => {
  try {
    const bruker = await User.findById(req.params.id);
    
    if (!bruker) {
      req.flash('error_msg', 'Bruker ikke funnet');
      return res.redirect('/admin/brukere');
    }
    
    // Hent alle quizzer som er opprettet av denne brukeren
    const brukerQuizzer = await Quiz.find({ opprettetAv: bruker._id })
      .sort({ opprettetDato: -1 });
    
    // Hent statistikk for brukerens quiz-forsøk
    const quizForsøk = await QuizAttempt.find({ bruker: bruker._id })
      .sort({ dato: -1 })
      .limit(10)
      .populate('quiz', 'tittel');
    
    res.render('admin/bruker-detaljer', {
      title: `Bruker: ${bruker.brukernavn}`,
      bruker,
      brukerQuizzer,
      quizForsøk
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste brukerdetaljer');
    res.redirect('/admin/brukere');
  }
};

// Oppdater bruker (endre rolle)
exports.oppdaterBruker = async (req, res) => {
  try {
    const { rolle } = req.body;
    
    // Valider rolle
    if (rolle !== 'admin' && rolle !== 'bruker') {
      req.flash('error_msg', 'Ugyldig rolle spesifisert');
      return res.redirect('/admin/brukere');
    }
    
    const bruker = await User.findById(req.params.id);
    
    if (!bruker) {
      req.flash('error_msg', 'Bruker ikke funnet');
      return res.redirect('/admin/brukere');
    }
    
    // Ikke la en admin degradere seg selv
    if (bruker._id.toString() === req.user._id.toString() && rolle !== 'admin') {
      req.flash('error_msg', 'Du kan ikke degradere din egen admin-status');
      return res.redirect(`/admin/brukere/${bruker._id}`);
    }
    
    bruker.rolle = rolle;
    await bruker.save();
    
    req.flash('success_msg', `Rolle for ${bruker.brukernavn} er oppdatert til ${rolle}`);
    
    // Redirect basert på hvor forespørselen kom fra
    if (req.headers.referer && req.headers.referer.includes(`/admin/brukere/${bruker._id}`)) {
      return res.redirect(`/admin/brukere/${bruker._id}`);
    }
    
    res.redirect('/admin/brukere');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke oppdatere bruker');
    res.redirect('/admin/brukere');
  }
};

// Slett bruker
exports.slettBruker = async (req, res) => {
  try {
    const bruker = await User.findById(req.params.id);
    
    if (!bruker) {
      req.flash('error_msg', 'Bruker ikke funnet');
      return res.redirect('/admin/brukere');
    }
    
    // Ikke la en admin slette seg selv
    if (bruker._id.toString() === req.user._id.toString()) {
      req.flash('error_msg', 'Du kan ikke slette din egen bruker');
      return res.redirect('/admin/brukere');
    }
    
    // Slett alle quizforsøk av brukeren
    await QuizAttempt.deleteMany({ bruker: bruker._id });
    
    // Slett alle quizzer opprettet av brukeren
    await Quiz.deleteMany({ opprettetAv: bruker._id });
    
    // Slett brukeren
    await User.deleteOne({ _id: bruker._id });
    
    req.flash('success_msg', `Brukeren ${bruker.brukernavn} og alle relaterte data er slettet`);
    res.redirect('/admin/brukere');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke slette bruker');
    res.redirect('/admin/brukere');
  }
};

// Vis alle quizzer (admin)
exports.alleQuizzer = async (req, res) => {
  try {
    const quizzer = await Quiz.find()
      .populate('opprettetAv', 'brukernavn')
      .sort({ opprettetDato: -1 });
    
    res.render('admin/quizzer', {
      title: 'Administrer Quizzer',
      quizzer
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste quizliste');
    res.redirect('/admin');
  }
};

// Slett quiz (admin)
exports.slettQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      req.flash('error_msg', 'Quiz ikke funnet');
      return res.redirect('/admin/quizzer');
    }
    
    // Slett alle forsøk på denne quizen
    await QuizAttempt.deleteMany({ quiz: req.params.id });
    
    // Slett quizen
    await Quiz.deleteOne({ _id: req.params.id });
    
    req.flash('success_msg', 'Quizzen er slettet');
    res.redirect('/admin/quizzer');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke slette quiz');
    // Redirect til siden der quizen ble funnet
    if (req.headers.referer && req.headers.referer.includes('/admin/quizzer')) {
      return res.redirect('/admin/quizzer');
    }
    // Hvis ikke, redirect til forsiden av admin
    res.redirect('/admin');
  }
};

// Vis alle spørsmål (admin)
exports.alleSporsmal = async (req, res) => {
  try {
    // Vi henter alle quizzer og flatter ut spørsmålene
    const quizzer = await Quiz.find().populate('opprettetAv', 'brukernavn');
    
    // Flatt ut alle spørsmål med quiz-informasjon
    const alleSporsmal = [];
    
    quizzer.forEach(quiz => {
      if (quiz.spørsmål && Array.isArray(quiz.spørsmål)) {
        quiz.spørsmål.forEach(sporsmal => {
          alleSporsmal.push({
            _id: sporsmal._id,
            tekst: sporsmal.tekst,
            type: sporsmal.type,
            poeng: sporsmal.poeng || 1,
            quizId: quiz._id,
            quizTittel: quiz.tittel,
            opprettetAv: quiz.opprettetAv
          });
        });
      }
    });
    
    res.render('admin/sporsmal', {
      title: 'Administrer Spørsmål',
      sporsmal: alleSporsmal
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste spørsmålsliste');
    res.redirect('/admin');
  }
};

// Vis ett spørsmål
exports.visSporsmal = async (req, res) => {
  try {
    // Finn quiz som inneholder spørsmålet
    const quiz = await Quiz.findOne({
      'spørsmål._id': req.params.id
    }).populate('opprettetAv', 'brukernavn');
    
    if (!quiz) {
      req.flash('error_msg', 'Spørsmål ikke funnet');
      return res.redirect('/admin/sporsmal');
    }
    
    // Finn spørsmålet i quizen
    const sporsmal = quiz.spørsmål.find(s => s._id.toString() === req.params.id);
    
    if (!sporsmal) {
      req.flash('error_msg', 'Spørsmål ikke funnet');
      return res.redirect('/admin/sporsmal');
    }
    
    res.render('admin/sporsmal-detaljer', {
      title: 'Spørsmålsdetaljer',
      sporsmal,
      quiz
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste spørsmålsdetaljer');
    res.redirect('/admin/sporsmal');
  }
};

// Vis redigering av spørsmål
exports.visRedigerSporsmal = async (req, res) => {
  try {
    // Finn quiz som inneholder spørsmålet
    const quiz = await Quiz.findOne({
      'spørsmål._id': req.params.id
    });
    
    if (!quiz) {
      req.flash('error_msg', 'Spørsmål ikke funnet');
      return res.redirect('/admin/sporsmal');
    }
    
    // Finn spørsmålet i quizen
    const sporsmal = quiz.spørsmål.find(s => s._id.toString() === req.params.id);
    
    if (!sporsmal) {
      req.flash('error_msg', 'Spørsmål ikke funnet');
      return res.redirect('/admin/sporsmal');
    }
    
    res.render('admin/rediger-sporsmal', {
      title: 'Rediger Spørsmål',
      sporsmal,
      quiz
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste spørsmål for redigering');
    res.redirect('/admin/sporsmal');
  }
};

// Oppdater spørsmål
exports.oppdaterSporsmal = async (req, res) => {
  try {
    const { tekst, type, poeng, alternativer, riktigAlternativ, riktigSvar } = req.body;
    
    // Finn quiz som inneholder spørsmålet
    const quiz = await Quiz.findOne({
      'spørsmål._id': req.params.id
    });
    
    if (!quiz) {
      req.flash('error_msg', 'Spørsmål ikke funnet');
      return res.redirect('/admin/sporsmal');
    }
    
    // Finn spørsmålet i quizen
    const sporsmalIndex = quiz.spørsmål.findIndex(s => s._id.toString() === req.params.id);
    
    if (sporsmalIndex === -1) {
      req.flash('error_msg', 'Spørsmål ikke funnet');
      return res.redirect('/admin/sporsmal');
    }
    
    // Oppdater spørsmålet basert på type
    quiz.spørsmål[sporsmalIndex].tekst = tekst;
    quiz.spørsmål[sporsmalIndex].type = type;
    quiz.spørsmål[sporsmalIndex].poeng = parseInt(poeng) || 1;
    
    if (type === 'flervalg') {
      // Parse alternativer og riktig alternativ
      const alternativListe = Array.isArray(alternativer) ? alternativer : [alternativer];
      const riktigIndeks = parseInt(riktigAlternativ);
      
      quiz.spørsmål[sporsmalIndex].alternativer = alternativListe.map((alt, idx) => ({
        tekst: alt,
        erRiktig: idx === riktigIndeks
      }));
    } 
    else if (type === 'sant_usant') {
      quiz.spørsmål[sporsmalIndex].alternativer = [
        { tekst: 'Sant', erRiktig: riktigAlternativ === 'sant' },
        { tekst: 'Usant', erRiktig: riktigAlternativ === 'usant' }
      ];
    } 
    else if (type === 'tekstsvar') {
      quiz.spørsmål[sporsmalIndex].riktigSvar = riktigSvar;
    }
    
    await quiz.save();
    
    req.flash('success_msg', 'Spørsmålet er oppdatert');
    res.redirect('/admin/sporsmal');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke oppdatere spørsmål');
    res.redirect(`/admin/sporsmal/${req.params.id}/rediger`);
  }
};

// Slett spørsmål
exports.slettSporsmal = async (req, res) => {
  try {
    // Finn quiz som inneholder spørsmålet
    const quiz = await Quiz.findOne({
      'spørsmål._id': req.params.id
    });
    
    if (!quiz) {
      req.flash('error_msg', 'Spørsmål ikke funnet');
      return res.redirect('/admin/sporsmal');
    }
    
    // Finn spørsmålet i quizen
    const sporsmalIndex = quiz.spørsmål.findIndex(s => s._id.toString() === req.params.id);
    
    if (sporsmalIndex === -1) {
      req.flash('error_msg', 'Spørsmål ikke funnet');
      return res.redirect('/admin/sporsmal');
    }
    
    // Fjern spørsmålet
    quiz.spørsmål.splice(sporsmalIndex, 1);
    await quiz.save();
    
    req.flash('success_msg', 'Spørsmålet er slettet');
    res.redirect('/admin/sporsmal');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke slette spørsmål');
    res.redirect('/admin/sporsmal');
  }
};

// Vis systeminnstillinger
exports.systemInnstillinger = async (req, res) => {
  try {
    // Hent systeminnstillinger fra database
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne({}) || {};
    
    // Samle systeminformasjon
    const systemInfo = {
      nodeVersion: process.version,
      mongoVersion: await getMongoVersion(),
      dbSize: await getDatabaseSize(),
      uptime: formatUptime(process.uptime())
    };
    
    res.render('admin/system', {
      title: 'Systeminnstillinger',
      settings,
      systemInfo
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste systeminnstillinger');
    res.redirect('/admin');
  }
};

// Oppdater systeminnstillinger
exports.oppdaterSystemInnstillinger = async (req, res) => {
  try {
    const { 
      siteName, 
      contactEmail, 
      maxQuizzesPerUser, 
      maxQuestionsPerQuiz 
    } = req.body;
    
    const enableRegistrations = req.body.enableRegistrations === 'on';
    const maintenanceMode = req.body.maintenanceMode === 'on';
    
    // Lagre systeminnstillinger
    const Settings = require('../models/Settings');
    
    let settings = await Settings.findOne({});
    
    if (!settings) {
      settings = new Settings();
    }
    
    settings.siteName = siteName;
    settings.contactEmail = contactEmail;
    settings.maxQuizzesPerUser = parseInt(maxQuizzesPerUser) || 50;
    settings.maxQuestionsPerQuiz = parseInt(maxQuestionsPerQuiz) || 100;
    settings.enableRegistrations = enableRegistrations;
    settings.maintenanceMode = maintenanceMode;
    settings.oppdatertAv = req.user._id;
    settings.oppdatertDato = Date.now();
    
    await settings.save();
    
    // Loggfør endringen
    loggAdminHandling(req, 'system_settings_update', 'Oppdaterte systeminnstillinger');
    
    req.flash('success_msg', 'Systeminnstillingene er oppdatert');
    res.redirect('/admin/system');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke oppdatere systeminnstillinger');
    res.redirect('/admin/system');
  }
};

// Ta sikkerhetskopi
exports.taSikkerhetskopi = async (req, res) => {
  try {
    const { includeUsers, includeQuizzes, includeAttempts, includeSettings } = req.body;
    const backupData = {};
    
    if (includeUsers === 'on') {
      const User = require('../models/User');
      backupData.users = await User.find({}).select('-passord');
    }
    
    if (includeQuizzes === 'on') {
      backupData.quizzes = await Quiz.find({});
    }
    
    if (includeAttempts === 'on') {
      const QuizAttempt = require('../models/QuizAttempt');
      backupData.attempts = await QuizAttempt.find({});
    }
    
    if (includeSettings === 'on') {
      const Settings = require('../models/Settings');
      backupData.settings = await Settings.findOne({});
    }
    
    // Legg til metadata
    backupData.metadata = {
      date: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      createdBy: req.user.brukernavn
    };
    
    // Oppdater siste sikkerhetskopi i innstillinger
    const Settings = require('../models/Settings');
    let settings = await Settings.findOne({});
    
    if (settings) {
      settings.lastBackup = new Date();
      await settings.save();
    }
    
    // Loggfør sikkerhetskopien
    loggAdminHandling(req, 'backup_created', 'Opprettet sikkerhetskopi av systemet');
    
    // Send sikkerhetskopien som JSON-fil
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `quiz-backup-${timestamp}.json`;
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke opprette sikkerhetskopi');
    res.redirect('/admin/system');
  }
};

// Gjenopprett fra sikkerhetskopi
exports.gjenopprettFraSikkerhetskopi = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error_msg', 'Ingen fil ble lastet opp');
      return res.redirect('/admin/system');
    }
    
    // Valider sikkerhetskopifilen
    let backupData;
    try {
      backupData = JSON.parse(req.file.buffer.toString());
    } catch (error) {
      req.flash('error_msg', 'Ugyldig sikkerhetskopifil');
      return res.redirect('/admin/system');
    }
    
    // Valider at metadata eksisterer
    if (!backupData.metadata) {
      req.flash('error_msg', 'Ugyldig sikkerhetskopifil: Mangler metadata');
      return res.redirect('/admin/system');
    }
    
    // Gjenopprett data fra sikkerhetskopien
    const restoreResults = {
      users: 0,
      quizzes: 0,
      attempts: 0,
      settings: false
    };
    
    // Gjenopprett brukere
    if (backupData.users && Array.isArray(backupData.users)) {
      const User = require('../models/User');
      
      // Slett alle eksisterende brukere unntatt gjeldende admin
      await User.deleteMany({ _id: { $ne: req.user._id } });
      
      // Oppdater passord-felt hvis det mangler
      const restoreUsers = backupData.users.filter(user => user._id !== req.user._id);
      for (const user of restoreUsers) {
        if (!user.passord) {
          // Generer tilfeldig passord for brukere som mangler passord
          user.passord = await require('argon2').hash('temp' + Math.random().toString(36).substring(2, 10));
        }
        
        await User.create(user);
      }
      
      restoreResults.users = restoreUsers.length;
    }
    
    // Gjenopprett quizzer
    if (backupData.quizzes && Array.isArray(backupData.quizzes)) {
      // Slett alle eksisterende quizzer
      await Quiz.deleteMany({});
      
      // Gjenopprett quizzer
      for (const quiz of backupData.quizzes) {
        await Quiz.create(quiz);
      }
      
      restoreResults.quizzes = backupData.quizzes.length;
    }
    
    // Gjenopprett quizforsøk
    if (backupData.attempts && Array.isArray(backupData.attempts)) {
      const QuizAttempt = require('../models/QuizAttempt');
      
      // Slett alle eksisterende forsøk
      await QuizAttempt.deleteMany({});
      
      // Gjenopprett forsøk
      for (const attempt of backupData.attempts) {
        await QuizAttempt.create(attempt);
      }
      
      restoreResults.attempts = backupData.attempts.length;
    }
    
    // Gjenopprett innstillinger
    if (backupData.settings) {
      const Settings = require('../models/Settings');
      
      // Slett alle eksisterende innstillinger
      await Settings.deleteMany({});
      
      // Gjenopprett innstillinger
      await Settings.create(backupData.settings);
      
      restoreResults.settings = true;
    }
    
    // Loggfør gjenoppretting
    loggAdminHandling(
      req, 
      'restore_completed', 
      `Gjenopprettet fra sikkerhetskopi: ${restoreResults.users} brukere, ${restoreResults.quizzes} quizzer, ${restoreResults.attempts} forsøk, innstillinger: ${restoreResults.settings ? 'Ja' : 'Nei'}`
    );
    
    req.flash('success_msg', `Gjenoppretting fullført! Brukere: ${restoreResults.users}, Quizzer: ${restoreResults.quizzes}, Forsøk: ${restoreResults.attempts}`);
    res.redirect('/admin/system');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke gjenopprette fra sikkerhetskopi');
    res.redirect('/admin/system');
  }
};

// Vis og filtrer aktivitetslogg
exports.aktivitetslogg = async (req, res) => {
  try {
    // Parse filter parametre med default-verdier
    const filter = {
      startDato: req.query.startDato || '',
      sluttDato: req.query.sluttDato || '',
      bruker: req.query.bruker || '',
      types: Array.isArray(req.query.types) ? req.query.types : 
             (req.query.types ? [req.query.types] : [])
    };
    
    // Bygg opp spørring basert på filtre
    const query = {};
    
    if (filter.startDato) {
      if (!query.dato) query.dato = {};
      query.dato.$gte = new Date(filter.startDato);
    }
    
    if (filter.sluttDato) {
      if (!query.dato) query.dato = {};
      const endDate = new Date(filter.sluttDato);
      endDate.setHours(23, 59, 59, 999);
      query.dato.$lte = endDate;
    }
    
    if (filter.bruker) {
      query.bruker = filter.bruker;
    }
    
    if (filter.types && filter.types.length > 0) {
      query.type = { $in: filter.types };
    }
    
    // Finn aktiviteter fra database
    const Aktivitet = require('../models/Aktivitet');
    const aktiviteter = await Aktivitet.find(query)
      .sort({ dato: -1 })
      .limit(500) // Begrens til 500 aktiviteter for ytelsesgrunner
      .populate('bruker', 'brukernavn')
      .populate('quiz', 'tittel');
    
    // Hent alle brukere for filteret
    const User = require('../models/User');
    const brukere = await User.find().sort('brukernavn');
    
    // Lagre filter i sesjon for bruk ved eksport
    req.session.aktivitetsloggFilter = query;
    
    res.render('admin/aktivitetslogg', {
      title: 'Aktivitetslogg',
      aktiviteter,
      brukere,
      filter, // Ensure filter is passed to the template
      csrfToken: req.csrfToken ? req.csrfToken() : '' // Add CSRF token if available
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste aktivitetslogg');
    res.redirect('/admin');
  }
};

// Eksporter aktivitetslogg
exports.eksporterAktivitetslogg = async (req, res) => {
  try {
    const { format, applyFilters } = req.body;
    
    // Hent aktiviteter fra database med filtrering hvis spesifisert
    const Aktivitet = require('../models/Aktivitet');
    let query = {};
    
    // Kopier filter fra sesjon hvis applyFilters er aktiv og filtre eksisterer
    if (applyFilters === 'on' && req.session.aktivitetsloggFilter) {
      query = { ...req.session.aktivitetsloggFilter };
    }
    
    const aktiviteter = await Aktivitet.find(query)
      .sort({ dato: -1 })
      .populate('bruker', 'brukernavn')
      .populate('quiz', 'tittel');
    
    // Formater data for eksport
    const formattertData = aktiviteter.map(aktivitet => ({
      dato: aktivitet.dato,
      bruker: aktivitet.bruker ? aktivitet.bruker.brukernavn : 'Gjest',
      type: aktivitet.type,
      detaljer: aktivitet.detaljer,
      quiz: aktivitet.quiz ? aktivitet.quiz.tittel : null,
      ip: aktivitet.ip
    }));
    
    // Eksporter basert på valgt format
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `aktivitetslogg-${timestamp}`;
    
    if (format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(formattertData, null, 2));
    } 
    else if (format === 'csv') {
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      res.setHeader('Content-Type', 'text/csv');
      
      let csv = 'Dato,Bruker,Type,Detaljer,Quiz,IP\n';
      formattertData.forEach(item => {
        csv += `"${new Date(item.dato).toLocaleString()}","${item.bruker}","${item.type}","${item.detaljer || ''}","${item.quiz || ''}","${item.ip || ''}"\n`;
      });
      
      res.send(csv);
    } 
    else if (format === 'xlsx') {
      const exceljs = require('exceljs');
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Aktivitetslogg');
      
      // Definer kolonner
      worksheet.columns = [
        { header: 'Dato', key: 'dato', width: 22 },
        { header: 'Bruker', key: 'bruker', width: 15 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Detaljer', key: 'detaljer', width: 30 },
        { header: 'Quiz', key: 'quiz', width: 20 },
        { header: 'IP', key: 'ip', width: 15 }
      ];
      
      // Legg til data
      formattertData.forEach(item => {
        worksheet.addRow({
          dato: new Date(item.dato).toLocaleString(),
          bruker: item.bruker,
          type: item.type,
          detaljer: item.detaljer || '',
          quiz: item.quiz || '',
          ip: item.ip || ''
        });
      });
      
      // Skriv til respons
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      req.flash('error_msg', 'Ugyldig eksportformat');
      return res.redirect('/admin/aktivitetslogg');
    }
    
    // Loggfør eksportering
    loggAdminHandling(req, 'log_export', `Eksporterte aktivitetslogg (${formattertData.length} oppføringer) i ${format} format`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke eksportere aktivitetslogg');
    res.redirect('/admin/aktivitetslogg');
  }
};

// Slett gamle aktiviteter
exports.slettGamleAktiviteter = async (req, res) => {
  try {
    const { slettEldre } = req.body;
    const dager = parseInt(slettEldre) || 30;
    
    // Beregn dato for sletting
    const slettFraDato = new Date();
    slettFraDato.setDate(slettFraDato.getDate() - dager);
    
    // Slett gamle aktiviteter
    const Aktivitet = require('../models/Aktivitet');
    const resultat = await Aktivitet.deleteMany({ dato: { $lt: slettFraDato } });
    
    // Loggfør sletting
    loggAdminHandling(req, 'logs_deleted', `Slettet ${resultat.deletedCount} aktiviteter eldre enn ${dager} dager`);
    
    req.flash('success_msg', `Slettet ${resultat.deletedCount} aktiviteter eldre enn ${dager} dager`);
    res.redirect('/admin/aktivitetslogg');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke slette gamle aktiviteter');
    res.redirect('/admin/aktivitetslogg');
  }
};

// Hjelpefunksjoner

// Loggfør admin handling
const loggAdminHandling = async (req, type, detaljer) => {
  try {
    const Aktivitet = require('../models/Aktivitet');
    const aktivitet = new Aktivitet({
      type: type || 'admin_action',
      bruker: req.user._id,
      detaljer: detaljer,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    await aktivitet.save();
  } catch (error) {
    console.error('Feil ved logging av admin handling:', error);
  }
};

// Hent MongoDB versjon
const getMongoVersion = async () => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection;
    const result = await db.db.admin().serverInfo();
    return result.version || 'Ukjent';
  } catch (error) {
    console.error('Kunne ikke hente MongoDB versjon:', error);
    return 'Ukjent';
  }
};

// Hent databasestørrelse
const getDatabaseSize = async () => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection;
    const stats = await db.db.stats();
    
    if (stats && stats.dataSize) {
      // Konverter bytes til lesbar størrelse
      const sizeInMB = stats.dataSize / (1024 * 1024);
      return sizeInMB.toFixed(2) + ' MB';
    }
    
    return 'Ukjent';
  } catch (error) {
    console.error('Kunne ikke hente databasestørrelse:', error);
    return 'Ukjent';
  }
};

// Formater opptid
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds - minutes * 60);
  
  let result = '';
  if (days > 0) result += `${days} dag${days !== 1 ? 'er' : ''}, `;
  if (hours > 0) result += `${hours} time${hours !== 1 ? 'r' : ''}, `;
  if (minutes > 0) result += `${minutes} minutt${minutes !== 1 ? 'er' : ''}, `;
  result += `${seconds} sekund${seconds !== 1 ? 'er' : ''}`;
  
  return result;
};
