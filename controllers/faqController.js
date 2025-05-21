const FAQ = require('../models/FAQ');

// FAQ Controller

// Vis FAQ side
exports.visFAQ = async (req, res) => {
  try {
    // Hent FAQs fra databasen
    const faqs = await FAQ.find({ aktiv: true }).sort({ rekkefølge: 1 });
    
    // Hvis ingen FAQs er funnet, bruk standard FAQs
    if (faqs.length === 0) {
      const standardFAQs = [
        {
          spørsmål: 'Hvordan oppretter jeg en quiz?',
          svar: 'Du må først logge inn. Gå deretter til "Lag Quiz" fra navigasjonsmenyen og følg instruksjonene der.'
        },
        {
          spørsmål: 'Hvilke typer spørsmål kan jeg lage?',
          svar: 'Du kan lage flervalgsoppgaver, sant/usant-spørsmål eller spørsmål med tekstsvar.'
        },
        {
          spørsmål: 'Kan jeg redigere en quiz etter at den er publisert?',
          svar: 'Ja, du kan redigere dine egne quizzer når som helst ved å gå til "Mine Quizzer".'
        },
        {
          spørsmål: 'Hvordan sletter jeg min quiz?',
          svar: 'Gå til "Mine Quizzer", finn quizen du vil slette, og klikk på sletteknappen.'
        },
        {
          spørsmål: 'Hva slags temaer bør quizzen min handle om?',
          svar: 'Quizzen bør inneholde begreper og tema fra de tre programfagene i Vg2 IT: Utvikling og standardisering, Planlegging og dokumentasjon, og Teknologiforståelse.'
        },
        {
          spørsmål: 'Kan jeg ta andres quizzer?',
          svar: 'Ja, alle publiserte quizzer er tilgjengelige for alle brukere å ta.'
        },
        {
          spørsmål: 'Hva gjør jeg hvis jeg har glemt passordet mitt?',
          svar: 'For øyeblikket må du kontakte en administrator for å få tilbakestilt passordet ditt.'
        },
        {
          spørsmål: 'Hvordan blir jeg administrator?',
          svar: 'Administratorroller tildeles av eksisterende administratorer. De kan endre brukerroller fra admin-panelet.'
        }
      ];
      
      return res.render('faq', {
        title: 'Vanlige Spørsmål (FAQ)',
        faqs: standardFAQs
      });
    }
    
    res.render('faq', {
      title: 'Vanlige Spørsmål (FAQ)',
      faqs
    });
  } catch (error) {
    console.error('Feil ved henting av FAQs:', error);
    // Ved feil, bruk standard FAQs
    const standardFAQs = [
      {
        spørsmål: 'Hvordan oppretter jeg en quiz?',
        svar: 'Du må først logge inn. Gå deretter til "Lag Quiz" fra navigasjonsmenyen og følg instruksjonene der.'
      },
      {
        spørsmål: 'Hvilke typer spørsmål kan jeg lage?',
        svar: 'Du kan lage flervalgsoppgaver, sant/usant-spørsmål eller spørsmål med tekstsvar.'
      },
      {
        spørsmål: 'Kan jeg redigere en quiz etter at den er publisert?',
        svar: 'Ja, du kan redigere dine egne quizzer når som helst ved å gå til "Mine Quizzer".'
      },
      {
        spørsmål: 'Hvordan sletter jeg min quiz?',
        svar: 'Gå til "Mine Quizzer", finn quizen du vil slette, og klikk på sletteknappen.'
      },
      {
        spørsmål: 'Hva slags temaer bør quizzen min handle om?',
        svar: 'Quizzen bør inneholde begreper og tema fra de tre programfagene i Vg2 IT: Utvikling og standardisering, Planlegging og dokumentasjon, og Teknologiforståelse.'
      },
      {
        spørsmål: 'Kan jeg ta andres quizzer?',
        svar: 'Ja, alle publiserte quizzer er tilgjengelige for alle brukere å ta.'
      },
      {
        spørsmål: 'Hva gjør jeg hvis jeg har glemt passordet mitt?',
        svar: 'For øyeblikket må du kontakte en administrator for å få tilbakestilt passordet ditt.'
      },
      {
        spørsmål: 'Hvordan blir jeg administrator?',
        svar: 'Administratorroller tildeles av eksisterende administratorer. De kan endre brukerroller fra admin-panelet.'
      }
    ];
    
    res.render('faq', {
      title: 'Vanlige Spørsmål (FAQ)',
      faqs: standardFAQs
    });
  }
};
