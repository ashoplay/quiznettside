document.addEventListener('DOMContentLoaded', function() {
    const spørsmålContainer = document.getElementById('spørsmålContainer');
    const leggTilSpørsmålBtn = document.getElementById('leggTilSpørsmål');
    const spørsmålTemplate = document.getElementById('spørsmålTemplate');
    const quizForm = document.getElementById('quizForm');
    const spørsmålDataInput = document.getElementById('spørsmålData');
    
    // Array til å holde spørsmålsdata
    let spørsmål = [];
    
    // Legg til første spørsmål automatisk
    leggTilSpørsmål();
    
    // Event for å legge til nytt spørsmål
    leggTilSpørsmålBtn.addEventListener('click', leggTilSpørsmål);
    
    // Event for å fjerne spørsmål (delegert)
    spørsmålContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('fjernSpørsmål') || 
            event.target.parentElement.classList.contains('fjernSpørsmål')) {
            
            const spørsmålElement = event.target.closest('.spørsmål');
            if (spørsmålContainer.querySelectorAll('.spørsmål').length > 1) {
                spørsmålElement.remove();
                oppdaterSpørsmålsnummerering();
            } else {
                alert('Quizzen må ha minst ett spørsmål');
            }
        }
    });
    
    // Event for å endre spørsmålstype
    spørsmålContainer.addEventListener('change', function(event) {
        if (event.target.classList.contains('spørsmålType')) {
            const spørsmålElement = event.target.closest('.spørsmål');
            const alternativerContainer = spørsmålElement.querySelector('.alternativerContainer');
            
            oppdaterAlternativer(alternativerContainer, event.target.value);
        }
    });
    
    // Submit form
    quizForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Validate required fields first
        const tittel = document.getElementById('tittel').value.trim();
        const beskrivelse = document.getElementById('beskrivelse').value.trim();
        const kategori = document.getElementById('kategori').value;
        
        if (!tittel || !beskrivelse || !kategori) {
            alert('Vennligst fyll ut alle påkrevde felt (tittel, beskrivelse, kategori)');
            return;
        }
        
        // Samle inn data fra hvert spørsmål
        spørsmål = [];
        const spørsmålElements = spørsmålContainer.querySelectorAll('.spørsmål');
        
        if (spørsmålElements.length === 0) {
            alert('Du må legge til minst ett spørsmål');
            return;
        }
        
        spørsmålElements.forEach(element => {
            const type = element.querySelector('.spørsmålType').value;
            const tekst = element.querySelector('.spørsmålTekst').value.trim();
            
            if (!tekst) {
                alert('Alle spørsmål må ha tekst');
                return;
            }
            
            const spørsmålData = {
                tekst: tekst,
                type: type,
                poeng: parseInt(element.querySelector('.poeng').value, 10) || 1
            };
            
            if (type === 'flervalg') {
                spørsmålData.alternativer = [];
                const alternativer = element.querySelectorAll('.alternativ');
                
                alternativer.forEach(alternativ => {
                    spørsmålData.alternativer.push({
                        tekst: alternativ.querySelector('.alternativTekst').value,
                        erRiktig: alternativ.querySelector('.erRiktig').checked
                    });
                });
            } 
            else if (type === 'sant_usant') {
                spørsmålData.alternativer = [
                    {
                        tekst: 'Sant',
                        erRiktig: element.querySelector('.svar-sant').checked
                    },
                    {
                        tekst: 'Usant',
                        erRiktig: element.querySelector('.svar-usant').checked
                    }
                ];
            } 
            else if (type === 'tekstsvar') {
                spørsmålData.riktigSvar = element.querySelector('.riktigTekstsvar').value;
            }
            
            spørsmål.push(spørsmålData);
        });
        
        // Valider spørsmål
        if (validerSpørsmål(spørsmål)) {
            try {
                // Make sure we have valid JSON before submitting
                const jsonData = JSON.stringify(spørsmål);
                spørsmålDataInput.value = jsonData;
                
                // Debug
                console.log('Submitting quiz with data:', {
                    tittel,
                    beskrivelse,
                    kategori,
                    'spørsmål count': spørsmål.length
                });
                
                quizForm.submit();
            } catch (error) {
                alert('Det oppstod en feil ved behandling av quiz-data. Vennligst prøv igjen.');
                console.error('Error stringifying quiz data:', error);
            }
        }
    });
    
    // Funksjon for å validere spørsmål
    function validerSpørsmål(spørsmål) {
        let erGyldig = true;
        
        spørsmål.forEach((sp, index) => {
            if (!sp.tekst) {
                alert(`Spørsmål ${index + 1} mangler spørsmålstekst`);
                erGyldig = false;
            }
            
            if (sp.type === 'flervalg') {
                if (sp.alternativer.length < 2) {
                    alert(`Spørsmål ${index + 1} må ha minst to alternativer`);
                    erGyldig = false;
                }
                
                if (!sp.alternativer.some(alt => alt.erRiktig)) {
                    alert(`Spørsmål ${index + 1} må ha minst ett riktig alternativ`);
                    erGyldig = false;
                }
                
                if (sp.alternativer.some(alt => !alt.tekst)) {
                    alert(`Spørsmål ${index + 1} har et alternativ uten tekst`);
                    erGyldig = false;
                }
            } 
            else if (sp.type === 'tekstsvar') {
                if (!sp.riktigSvar) {
                    alert(`Spørsmål ${index + 1} mangler riktig svar`);
                    erGyldig = false;
                }
            }
        });
        
        return erGyldig;
    }
    
    // Funksjon for å legge til et nytt spørsmål
    function leggTilSpørsmål() {
        const nyTemplate = document.importNode(spørsmålTemplate.content, true);
        spørsmålContainer.appendChild(nyTemplate);
        
        // Oppdater nummerering
        oppdaterSpørsmålsnummerering();
        
        // Sett opp alternativer for det nye spørsmålet (standard er flervalg)
        const nyAlternativerContainer = spørsmålContainer.lastElementChild.querySelector('.alternativerContainer');
        oppdaterAlternativer(nyAlternativerContainer, 'flervalg');
    }
    
    // Funksjon for å oppdatere alternativene basert på spørsmålstype
    function oppdaterAlternativer(container, type) {
        container.innerHTML = '';
        
        if (type === 'flervalg') {
            container.innerHTML = `
                <div class="alternativer">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label>Alternativer</label>
                        <button type="button" class="btn btn-sm btn-success leggTilAlternativ">
                            <i class="fas fa-plus"></i> Legg til alternativ
                        </button>
                    </div>
                    <div class="alternativListe">
                        <div class="alternativ mb-2">
                            <div class="input-group">
                                <div class="input-group-prepend">
                                    <div class="input-group-text">
                                        <input type="checkbox" class="erRiktig" title="Marker som riktig svar">
                                    </div>
                                </div>
                                <input type="text" class="form-control alternativTekst" placeholder="Alternativ tekst">
                                <div class="input-group-append">
                                    <button class="btn btn-outline-danger fjernAlternativ" type="button">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="alternativ mb-2">
                            <div class="input-group">
                                <div class="input-group-prepend">
                                    <div class="input-group-text">
                                        <input type="checkbox" class="erRiktig" title="Marker som riktig svar">
                                    </div>
                                </div>
                                <input type="text" class="form-control alternativTekst" placeholder="Alternativ tekst">
                                <div class="input-group-append">
                                    <button class="btn btn-outline-danger fjernAlternativ" type="button">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Legg til event listener for "Legg til alternativ" knappen
            container.querySelector('.leggTilAlternativ').addEventListener('click', function() {
                const alternativListe = this.closest('.alternativer').querySelector('.alternativListe');
                const nyAlternativ = document.createElement('div');
                nyAlternativ.className = 'alternativ mb-2';
                nyAlternativ.innerHTML = `
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <div class="input-group-text">
                                <input type="checkbox" class="erRiktig" title="Marker som riktig svar">
                            </div>
                        </div>
                        <input type="text" class="form-control alternativTekst" placeholder="Alternativ tekst">
                        <div class="input-group-append">
                            <button class="btn btn-outline-danger fjernAlternativ" type="button">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
                alternativListe.appendChild(nyAlternativ);
            });
            
            // Delegert event listener for "Fjern alternativ" knappene
            container.querySelector('.alternativListe').addEventListener('click', function(event) {
                if (event.target.classList.contains('fjernAlternativ') || 
                    event.target.parentElement.classList.contains('fjernAlternativ')) {
                    
                    const alternativElement = event.target.closest('.alternativ');
                    const alternativListe = alternativElement.parentElement;
                    
                    if (alternativListe.querySelectorAll('.alternativ').length > 2) {
                        alternativElement.remove();
                    } else {
                        alert('Du må ha minst to alternativer');
                    }
                }
            });
        } 
        else if (type === 'sant_usant') {
            const timestamp = Date.now();
            container.innerHTML = `
                <div class="form-group">
                    <label>Riktig svar</label>
                    <div class="custom-control custom-radio">
                        <input type="radio" id="svar-sant-${timestamp}" name="svar-${timestamp}" class="custom-control-input svar-sant" checked>
                        <label class="custom-control-label" for="svar-sant-${timestamp}">Sant</label>
                    </div>
                    <div class="custom-control custom-radio">
                        <input type="radio" id="svar-usant-${timestamp}" name="svar-${timestamp}" class="custom-control-input svar-usant">
                        <label class="custom-control-label" for="svar-usant-${timestamp}">Usant</label>
                    </div>
                </div>
            `;
        } 
        else if (type === 'tekstsvar') {
            container.innerHTML = `
                <div class="form-group">
                    <label>Riktig svar</label>
                    <input type="text" class="form-control riktigTekstsvar" placeholder="Skriv inn det riktige svaret">
                </div>
            `;
        }
    }
    
    // Funksjon for å oppdatere nummereringen av spørsmål
    function oppdaterSpørsmålsnummerering() {
        const spørsmålElements = spørsmålContainer.querySelectorAll('.spørsmål');
        spørsmålElements.forEach((element, index) => {
            element.querySelector('.spørsmålNummer').textContent = index + 1;
        });
    }
});
