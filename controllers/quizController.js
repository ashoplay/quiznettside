const Quiz = require('../models/Quiz');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt'); // Add this line

// Vis alle publiserte quizzer
exports.alleQuizzer = async (req, res) => {
  try {
    const quizzer = await Quiz.find({ erPublisert: true })
      .populate('opprettetAv', 'brukernavn')
      .sort({ opprettetDato: -1 });
    
    res.render('quizzes/index', {
      title: 'Alle Quizzer',
      quizzer
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke hente quizzer');
    res.redirect('/');
  }
};

// Vis en spesifikk quiz
exports.visQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('opprettetAv', 'brukernavn');
    
    if (!quiz) {
      req.flash('error_msg', 'Quiz ikke funnet');
      return res.redirect('/quizzes');
    }
    
    res.render('quizzes/show', {
      title: quiz.tittel,
      quiz
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke hente quiz');
    res.redirect('/quizzes');
  }
};

// Vis skjema for å lage ny quiz
exports.visSkapQuiz = (req, res) => {
  res.render('quizzes/create', {
    title: 'Lag en ny Quiz'
  });
};

// Opprett ny quiz
exports.opprettQuiz = async (req, res) => {
  try {
    const { tittel, beskrivelse, kategori, spørsmål } = req.body;
    
    // Mer robust validering av input
    if (!tittel || !beskrivelse || !kategori) {
      req.flash('error_msg', 'Alle feltene må fylles ut');
      return res.redirect('/quizzes/create');
    }
    
    if (!spørsmål || spørsmål === '') {
      req.flash('error_msg', 'Du må legge til minst ett spørsmål');
      return res.redirect('/quizzes/create');
    }
    
    // Validate JSON parsing
    let parsedSpørsmål;
    try {
      parsedSpørsmål = JSON.parse(spørsmål);
      if (!Array.isArray(parsedSpørsmål) || parsedSpørsmål.length === 0) {
        throw new Error('Ugyldig spørsmålsformat');
      }
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      req.flash('error_msg', 'Ugyldig spørsmålsformat. Vennligst prøv igjen.');
      return res.redirect('/quizzes/create');
    }
    
    const nyQuiz = new Quiz({
      tittel,
      beskrivelse,
      kategori,
      opprettetAv: req.user._id,
      spørsmål: parsedSpørsmål
    });
    
    await nyQuiz.save();
    
    req.flash('success_msg', 'Quizen din er nå opprettet!');
    res.redirect('/quizzes/mine/quizzer');
  } catch (error) {
    console.error('Quiz creation error:', error);
    req.flash('error_msg', 'Kunne ikke opprette quiz: ' + (error.message || 'Ukjent feil'));
    res.redirect('/quizzes/create');
  }
};

// Vis mine quizzer
exports.mineQuizzer = async (req, res) => {
  try {
    const quizzer = await Quiz.find({ opprettetAv: req.user._id })
      .sort({ opprettetDato: -1 });
    
    res.render('quizzes/mine-quizzer', {
      title: 'Mine Quizzer',
      quizzer
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke hente dine quizzer');
    res.redirect('/');
  }
};

// Vis skjema for å redigere quiz
exports.visRedigerQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      req.flash('error_msg', 'Quiz ikke funnet');
      return res.redirect('/quizzes');
    }
    
    // Sjekk om brukeren har rettigheter til å redigere (må være eier eller admin)
    if (quiz.opprettetAv.toString() !== req.user._id.toString() && req.user.rolle !== 'admin') {
      req.flash('error_msg', 'Du har ikke tillatelse til å redigere denne quizen');
      return res.redirect('/quizzes');
    }
    
    res.render('quizzes/edit', {
      quiz: quiz,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Kunne ikke laste quiz for redigering');
    res.redirect('/quizzes');
  }
};

// Oppdater quiz
exports.oppdaterQuiz = async (req, res) => {
  try {
    const { tittel, beskrivelse, kategori, spørsmål, erPublisert } = req.body;
    
    let quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      req.flash('error_msg', 'Quiz ikke funnet');
      return res.redirect('/quizzes/mine/quizzer');
    }
    
    // Sjekk om brukeren har rettigheter til å oppdatere (må være eier eller admin)
    if (quiz.opprettetAv.toString() !== req.user._id.toString() && req.user.rolle !== 'admin') {
      req.flash('error_msg', 'Du har ikke tillatelse til å oppdatere denne quizen');
      return res.redirect('/quizzes/mine/quizzer');
    }
    
    quiz.tittel = tittel;
    quiz.beskrivelse = beskrivelse;
    quiz.kategori = kategori;
    quiz.spørsmål = JSON.parse(spørsmål);
    quiz.erPublisert = erPublisert === 'true';
    
    await quiz.save();
    
    req.flash('success_msg', 'Quizen er oppdatert');
    
    // Redirect basert på brukerrolle
    if (req.user.rolle === 'admin' && req.headers.referer && req.headers.referer.includes('/admin/')) {
      return res.redirect('/admin/quizzer');
    }
    
    res.redirect('/quizzes/mine/quizzer');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke oppdatere quiz');
    res.redirect(`/quizzes/${req.params.id}/rediger`);
  }
};

// Slett quiz (for brukere)
exports.slettQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      req.flash('error_msg', 'Quiz ikke funnet');
      return res.redirect('/quizzes/mine/quizzer');
    }
    
    // Sjekk om brukeren har rettigheter til å slette (må være eier eller admin)
    if (quiz.opprettetAv.toString() !== req.user._id.toString() && req.user.rolle !== 'admin') {
      req.flash('error_msg', 'Du har ikke tillatelse til å slette denne quizen');
      return res.redirect('/quizzes/mine/quizzer');
    }
    
    // Slett alle forsøk på denne quizen
    await QuizAttempt.deleteMany({ quiz: req.params.id });
    
    // Slett quizen
    await Quiz.deleteOne({ _id: req.params.id });
    
    req.flash('success_msg', 'Quizen er slettet');
    
    // Redirect basert på brukerrolle
    if (req.user.rolle === 'admin' && req.headers.referer && req.headers.referer.includes('/admin/')) {
      return res.redirect('/admin/quizzer');
    }
    
    res.redirect('/quizzes/mine/quizzer');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke slette quiz');
    res.redirect('/quizzes/mine/quizzer');
  }
};

// Ta en quiz
exports.taQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('opprettetAv', 'brukernavn');
    
    if (!quiz || !quiz.erPublisert) {
      req.flash('error_msg', 'Quiz ikke funnet eller ikke publisert');
      return res.redirect('/quizzes');
    }
    
    // Forbered quizen for visning (fjern svarene)
    const quizForVisning = {
      _id: quiz._id,
      tittel: quiz.tittel,
      beskrivelse: quiz.beskrivelse,
      kategori: quiz.kategori,
      opprettetAv: quiz.opprettetAv,
      spørsmål: quiz.spørsmål.map(sp => {
        // For flervalg og sant_usant, fjern info om hvilke alternativer som er riktige
        let forberedteAlternativer = [];
        if (sp.type === 'flervalg' || sp.type === 'sant_usant') {
          forberedteAlternativer = sp.alternativer.map(alt => ({
            _id: alt._id,
            tekst: alt.tekst
          }));
        }
        
        return {
          _id: sp._id,
          tekst: sp.tekst,
          type: sp.type,
          alternativer: forberedteAlternativer,
          bilde: sp.bilde
        };
      })
    };
    
    res.render('quizzes/take', {
      title: `Ta Quiz: ${quiz.tittel}`,
      quiz: quizForVisning
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke laste quiz');
    res.redirect('/quizzes');
  }
};

// Lever svar på quiz
exports.leverSvar = async (req, res) => {
  try {
    console.log('Quiz submission received:', req.body);
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      console.error('Quiz not found with ID:', req.params.id);
      req.flash('error', 'Quiz ikke funnet');
      return res.redirect('/quizzes');
    }
    
    // Improved method to parse form data
    const userAnswers = {};
    
    // Loop through all keys in the request body
    for (const key in req.body) {
      // Check for both formats: 'svar[X]' and direct property names
      if (key.includes('svar[')) {
        // Extract the question index using regex
        const match = key.match(/svar\[(\d+)\]/);
        if (match && match[1]) {
          const index = match[1];
          userAnswers[index] = req.body[key];
          console.log(`Found answer for question ${index}:`, req.body[key]);
        }
      }
    }
    
    // If userAnswers is still empty, try direct access 
    // (this handles cases where Express might parse brackets differently)
    if (Object.keys(userAnswers).length === 0) {
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('svar')) {
          try {
            // Find any keys that might be related to answers
            const potentialIndex = key.replace('svar', '').replace('[', '').replace(']', '');
            if (/^\d+$/.test(potentialIndex)) {
              userAnswers[potentialIndex] = req.body[key];
              console.log(`Using direct access - found answer for question ${potentialialIndex}:`, req.body[key]);
            }
          } catch (e) {
            console.error('Error parsing answer key:', e);
          }
        }
      });
    }
    
    console.log('User answers received:', userAnswers);
    
    const tidBrukt = parseInt(req.body.tidBrukt) || 0;
    
    let totalPoeng = 0;
    let maksPoeng = 0;
    const svar = [];
    
    // Ensure questions array exists
    if (!quiz.spørsmål || !Array.isArray(quiz.spørsmål)) {
      console.error('Quiz has no questions or questions is not an array');
      quiz.spørsmål = [];
    }
    
    // Process each question and the user's answer
    quiz.spørsmål.forEach((spørsmål, index) => {
      // Add to maximum possible points
      const questionPoints = spørsmål.poeng || 1;
      maksPoeng += questionPoints;
      
      // Get user's answer for this question (could be undefined if not answered)
      let brukerSvar = userAnswers[index];
      console.log(`Question ${index}: User answer:`, brukerSvar);
      
      // If the answer is an array, take the first element
      if (Array.isArray(brukerSvar)) {
        brukerSvar = brukerSvar[0];
      }
      
      // Store processed answer for result page
      svar[index] = brukerSvar || null;
      
      // Only process score if user provided an answer
      if (brukerSvar) {
        // Check if answer is correct based on question type
        if (spørsmål.type === 'flervalg' || spørsmål.type === 'sant_usant') {
          // For multiple choice, check if the user selected the correct option
          if (spørsmål.alternativer && Array.isArray(spørsmål.alternativer)) {
            // Find the correct alternative
            const riktigAlternativ = spørsmål.alternativer.find(alt => alt && alt.erRiktig);
            
            if (riktigAlternativ && riktigAlternativ._id) {
              // Convert both to string for comparison to avoid type mismatches
              const riktigId = riktigAlternativ._id.toString();
              const brukerSvarId = brukerSvar.toString();
              
              if (riktigId === brukerSvarId) {
                totalPoeng += questionPoints;
                console.log(`Question ${index + 1}: Correct! +${questionPoints} points`);
              } else {
                console.log(`Question ${index + 1}: Incorrect. User answer: ${brukerSvarId}, Correct: ${riktigId}`);
              }
            }
          }
        } else if (spørsmål.type === 'tekstsvar') {
          // For text answers, compare lowercased and trimmed values
          if (spørsmål.riktigSvar) {
            const userTextAnswer = brukerSvar.toLowerCase().trim();
            const correctTextAnswer = spørsmål.riktigSvar.toLowerCase().trim();
            
            if (userTextAnswer === correctTextAnswer) {
              totalPoeng += questionPoints;
              console.log(`Question ${index + 1}: Correct text answer! +${questionPoints} points`);
            } else {
              console.log(`Question ${index + 1}: Incorrect text answer. User: "${userTextAnswer}", Correct: "${correctTextAnswer}"`);
            }
          }
        }
      } else {
        console.log(`Question ${index + 1}: No answer provided`);
      }
    });
    
    // Ensure we have valid values
    totalPoeng = Math.max(0, totalPoeng);
    maksPoeng = Math.max(1, maksPoeng); // Avoid division by zero
    
    // Calculate percentage with proper rounding
    const prosentRiktig = Math.round((totalPoeng / maksPoeng) * 100);
    
    console.log(`Quiz submission: ${totalPoeng}/${maksPoeng} points (${prosentRiktig}%)`);
    
    // Save attempt if user is logged in
    if (req.user) {
      try {
        const attempt = new QuizAttempt({
          quiz: quiz._id,
          bruker: req.user._id,
          poengOppnådd: totalPoeng,
          maksPoeng: maksPoeng,
          prosentRiktig: prosentRiktig,
          tidBrukt: tidBrukt
        });
        await attempt.save();
        console.log(`Saved quiz attempt for user ${req.user._id}`);
      } catch (saveError) {
        console.error('Failed to save quiz attempt:', saveError);
      }
    }
    
    // Render result page
    return res.render('quizzes/result', {
      quiz,
      svar,
      totalPoeng,
      maksPoeng,
      prosentRiktig,
      tidBrukt
    });
    
  } catch (err) {
    console.error('Error processing quiz answers:', err);
    req.flash('error', 'Kunne ikke beregne resultat');
    res.redirect('/quizzes');
  }
};

// Vis quiz historikk for innlogget bruker
exports.quizHistorikk = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ bruker: req.user._id })
      .populate('quiz', 'tittel kategori')
      .sort({ dato: -1 });
    
    res.render('quizzes/historikk', {
      title: 'Min Quiz Historikk',
      attempts
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke hente quiz historikk');
    res.redirect('/');
  }
};

// Admin: Slett quiz
exports.adminSlettQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      req.flash('error_msg', 'Quiz ikke funnet');
      return res.redirect('/admin/quizzes');
    }
    
    await Quiz.deleteOne({ _id: req.params.id });
    
    req.flash('success_msg', 'Quizen er slettet av administrator');
    res.redirect('/admin/quizzes');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke slette quiz');
    res.redirect('/admin/quizzes');
  }
};

// Vis statistikk for en quiz
exports.visStatistikk = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      req.flash('error_msg', 'Quiz ikke funnet');
      return res.redirect('/quizzes/mine/quizzer');
    }
    
    // Sjekk om brukeren har tilgang (må være eier av quizen)
    if (quiz.opprettetAv.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Du har ikke tilgang til å se statistikk for denne quizen');
      return res.redirect('/quizzes/mine/quizzer');
    }
    
    // Hent alle forsøk på denne quizen
    const attempts = await QuizAttempt.find({ quiz: req.params.id })
      .populate('bruker', 'brukernavn');
    
    // Beregn statistikk
    const antallForsøk = attempts.length;
    const gjennomsnittScore = antallForsøk > 0 
      ? attempts.reduce((sum, att) => sum + att.prosentRiktig, 0) / antallForsøk 
      : 0;
    
    res.render('quizzes/statistikk', {
      title: 'Quiz Statistikk',
      quiz,
      attempts,
      statistikk: {
        antallForsøk,
        gjennomsnittScore: Math.round(gjennomsnittScore)
      }
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Kunne ikke hente statistikk');
    res.redirect('/quizzes/mine/quizzer');
  }
};
