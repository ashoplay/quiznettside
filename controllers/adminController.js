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

// Vis aktivitetslogg
exports.aktivitetslogg = async (req, res) => {
  try {
    // Hent de siste 100 quiz-forsøkene
    const aktiviteter = await QuizAttempt.find()
      .sort({ dato: -1 })
      .limit(100)
      .populate('bruker', 'brukernavn')
      .populate('quiz', 'tittel');
    
    res.render('admin/aktivitetslogg', {
      title: 'Aktivitetslogg',
      aktiviteter
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste aktivitetslogg');
    res.redirect('/admin');
  }
};
