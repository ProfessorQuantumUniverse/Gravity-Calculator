document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    // Tab 1 Elements
    const massMInput = document.getElementById('mass-M');
    const unitMSelect = document.getElementById('unit-M');
    const massmInput = document.getElementById('mass-m');
    const unitmSelect = document.getElementById('unit-m');
    const distanceLInput = document.getElementById('distance-l');
    const unitLSelect = document.getElementById('unit-l');
    const periodTInput = document.getElementById('period-T');
    const calculateDatenButton = document.getElementById('calculate-daten');
    const outputI = document.getElementById('output-I');
    const outputKappa = document.getElementById('output-kappa');
    const formulaIDisplay = document.getElementById('formula-I');
    const formulaKappaDisplay = document.getElementById('formula-kappa');
    const visLLabel = document.getElementById('vis-l-label');
    const visBeamLine = document.getElementById('vis-beam-line');
    const visLArrow = document.getElementById('vis-l-arrow');
    const distAfInput = document.getElementById('dist-af');
    const dmKkInput = document.getElementById('dm-kk');
    const dmGkInput = document.getElementById('dm-gk');

    // Tab 2 Elements (Endausschlag)
    const angleThetaInput = document.getElementById('angle-theta');
    const unitThetaSelect = document.getElementById('unit-theta');
    const distanceBInput = document.getElementById('distance-b');
    const unitBSelect = document.getElementById('unit-b');
    const calculateGEndButton = document.getElementById('calculate-g-end');
    const outputGEnd = document.getElementById('output-G-end');
    const formulaGEndDisplay = document.getElementById('formula-G-end');
    const outputK = document.getElementById('output-K');
    const formulaKDisplay = document.getElementById('formula-K');
    const outputGEndCorrected = document.getElementById('output-G-end-corrected');
    const visBeamRotated = document.getElementById('vis-beam-rotated');
    const visForceArrow1 = document.getElementById('force-arrow-1');
    const visForceArrow2 = document.getElementById('force-arrow-2');
    const visAngleArc = document.getElementById('angle-arc');
    const visThetaLabel = document.getElementById('vis-theta-label');

    // Tab 3 Elements (Beschleunigung & Ergebnisse)
    const distanceL0Input = document.getElementById('distance-L0');
    const unitL0Select = document.getElementById('unit-L0');
    const distanceL1Input = document.getElementById('distance-L1');
    const unitL1Select = document.getElementById('unit-L1');
    const slopeAccelInput = document.getElementById('slope-accel');
    const unitSlopeAccelSelect = document.getElementById('unit-slope-accel');
    const calculateGAccelButton = document.getElementById('calculate-g-accel');
    const outputGAccel = document.getElementById('output-G-accel');
    const formulaGAccelDisplay = document.getElementById('formula-G-accel');
    const formulaDisplaySlope = document.getElementById('formula-display-slope');
    const addDataPointButton = document.getElementById('add-data-point');
    const slopeDataContainer = document.getElementById('slope-data-input');
    const calculateSlopeButton = document.getElementById('calculate-slope');
    const slopeResultDisplay = document.getElementById('slope-result');

    const standardGDisplay = document.getElementById('standard-g');
    const yourGResultEndDisplay = document.getElementById('your-g-result-end');
    const gDeviationEndDisplay = document.getElementById('g-deviation-end');
    const yourGResultAccelDisplay = document.getElementById('your-g-result-accel');
    const gDeviationAccelDisplay = document.getElementById('g-deviation-accel');
    const exportCsvButton = document.getElementById('export-csv');
    const exportPdfButton = document.getElementById('export-pdf');
    const historyTableContainer = document.getElementById('history-table-container');
    const clearHistoryButton = document.getElementById('clear-history');

    // --- Constants ---
    const STANDARD_G = 6.67430e-11;
    standardGDisplay.textContent = STANDARD_G.toExponential(5) + " N⋅m²/kg²";

    // --- State Variables ---
    let calculatedI = null;
    let calculatedKappa = null;
    let calculatedG_end = null;
    let calculatedK = null;
    let calculatedG_end_corrected = null;
    let calculatedG_accel = null;
    let calculatedSlope = null;
    let history = JSON.parse(localStorage.getItem('cavendishHistory')) || [];

    // --- Helper Functions ---

    function formatNumber(num, precision = 4) {
        if (num === null || num === undefined || isNaN(num)) return '-';
        // Höhere Präzision für G
        if (Math.abs(num) > 1e-12 && Math.abs(num) < 1e-10) precision = 5;
        // Keine wissenschaftliche Notation für K zwischen 0.1 und 10
        if (num === calculatedK && Math.abs(num) > 0.1 && Math.abs(num) < 10) {
            return num.toFixed(precision);
        }
        // Standardformatierung
        if (Math.abs(num) < 1e-3 || Math.abs(num) >= 1e4) {
            return num.toExponential(precision);
        }
        return num.toFixed(precision);
    }

     function updateFormulaDisplay(element, baseFormula, values) {
        let formula = baseFormula;
        for (const key in values) {
            const value = values[key];
            const formattedValue = (value !== null && value !== undefined && !isNaN(value))
                                   ? formatNumber(value, 3) // Weniger Präzision für Formelanzeige
                                   : '?';
             // Ersetzt ganze Wörter oder einzelne Buchstaben (Variablen)
             const regex = new RegExp(`\\b${key}\\b`, 'g');
             formula = formula.replace(regex, `<code>${formattedValue}</code>`);
        }
        formula = formula.replace(/\*/g, ' × ').replace(/\//g, ' / ').replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/sqrt/g, '√').replace(/π/g, 'π');
        element.innerHTML = formula;
    }

     function getValueInBaseUnits(inputElement, unitSelectElement) {
        const value = parseFloat(inputElement.value);
        if (isNaN(value)) return NaN;
        const unit = unitSelectElement.value;
        switch (unit) {
            case 'g': return value / 1000; // g to kg
            case 'cm': return value / 100;  // cm to m
            case 'mm': return value / 1000; // mm to m
            case 'deg': return value * (Math.PI / 180); // deg to rad
            case 'mm/s2': return value / 1000; // mm/s² to m/s²
            default: return value; // kg, m, s, rad, m/s²
        }
    }

    function validateInput(inputElement, mustBePositive = true, allowZero = false) {
        const value = parseFloat(inputElement.value);
        let isValid = !isNaN(value);
        if (isValid && mustBePositive && !allowZero) {
            isValid = value > 0;
        } else if (isValid && mustBePositive && allowZero) {
             isValid = value >= 0;
        } else if (isValid && !mustBePositive) {
             // Keine Positivitätsprüfung nötig (nur NaN check)
        }
        if (isValid) {
            inputElement.classList.remove('error');
        } else {
            inputElement.classList.add('error');
        }
        return isValid;
    }

    // --- Visualization Updates ---
    function updateDatenVisualization(l_m) {
         if (!isNaN(l_m) && l_m > 0) {
             const scale = 100 / Math.max(0.1, l_m);
             const half_l_scaled = (l_m / 2) * scale;
             visBeamLine.setAttribute('x1', -half_l_scaled);
             visBeamLine.setAttribute('x2', half_l_scaled);
             document.getElementById('vis-m1').setAttribute('cx', -half_l_scaled);
             document.getElementById('vis-m2').setAttribute('cx', half_l_scaled);
             visLArrow.setAttribute('x1', -half_l_scaled);
             visLArrow.setAttribute('x2', half_l_scaled);
             visLLabel.textContent = `l = ${formatNumber(l_m, 3)} m`;
        } else {
             visLLabel.textContent = `l = ?`;
        }
    }
    function updateForcesVisualization(theta_rad) { /* Unverändert */
          if(isNaN(theta_rad)) theta_rad = 0;
          const theta_deg = theta_rad * (180 / Math.PI);
          visBeamRotated.setAttribute('transform', `rotate(${theta_deg})`);
          visForceArrow1.setAttribute('transform', `rotate(${theta_deg})`);
          visForceArrow2.setAttribute('transform', `rotate(${theta_deg})`);
          visThetaLabel.textContent = `θ = ${formatNumber(theta_rad, 4)} rad`;
           const radius = 20;
           const endX = radius * Math.cos(theta_rad);
           const endY = radius * Math.sin(theta_rad);
           const largeArcFlag = Math.abs(theta_rad) <= Math.PI ? "0" : "1";
           const sweepFlag = theta_rad >= 0 ? "1" : "0";
           visAngleArc.setAttribute('d', `M ${radius} 0 A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`);
    }

    // --- Calculation Functions ---
    function calculateIntermediateData() {
        resetIntermediateResults();
        resetGEndResults();
        resetGAccelResults();
        resetCorrectionFactor();

        const isValidM = validateInput(massMInput);
        const isValidm = validateInput(massmInput);
        const isValidl = validateInput(distanceLInput);
        const isValidT = validateInput(periodTInput);

        if (!isValidM || !isValidm || !isValidl || !isValidT) return;

        const m_kg = getValueInBaseUnits(massmInput, unitmSelect);
        const l_m = getValueInBaseUnits(distanceLInput, unitLSelect);
        const T_s = getValueInBaseUnits(periodTInput, { value: 's' });

        updateDatenVisualization(l_m);

        calculatedI = 2 * m_kg * Math.pow(l_m / 2, 2);
        outputI.value = formatNumber(calculatedI);
        updateFormulaDisplay(formulaIDisplay, 'I = 2 * m * (l/2)² =', { m: m_kg, l: l_m });

        if (T_s === 0) {
            outputKappa.value = 'Error: T=0'; periodTInput.classList.add('error'); return;
        }
        calculatedKappa = (4 * Math.pow(Math.PI, 2) * calculatedI) / Math.pow(T_s, 2);
        outputKappa.value = formatNumber(calculatedKappa);
        updateFormulaDisplay(formulaKappaDisplay, 'κ = (4 * π² * I) / T² =', { I: calculatedI, T: T_s });

        // Enable G calculation buttons if I and κ are valid
        calculateGEndButton.disabled = false;
        calculateGAccelButton.disabled = false;
    }

    function calculateG_Endausschlag() {
        resetGEndResults();
        resetCorrectionFactor();

        if (calculatedKappa === null) {
            alert("Bitte zuerst I & κ in Tab 1 berechnen."); switchTabDirect('tab-daten'); return;
        }
        const isValidM = validateInput(massMInput); // Re-validate inputs needed
        const isValidm = validateInput(massmInput);
        const isValidl = validateInput(distanceLInput);
        const isValidTheta = validateInput(angleThetaInput, false, true); // false=nicht pos., true=0 erlaubt
        const isValidB = validateInput(distanceBInput);

        if (!isValidM || !isValidm || !isValidl || !isValidTheta || !isValidB) return;

        const M_kg = getValueInBaseUnits(massMInput, unitMSelect);
        const m_kg = getValueInBaseUnits(massmInput, unitmSelect);
        const l_m = getValueInBaseUnits(distanceLInput, unitLSelect);
        const theta_rad = getValueInBaseUnits(angleThetaInput, unitThetaSelect);
        const b_m = getValueInBaseUnits(distanceBInput, unitBSelect);

        updateForcesVisualization(theta_rad);

        if (M_kg === 0 || m_kg === 0 || l_m === 0 || b_m === 0) { // b=0 ist physikalisch unsinnig
            outputGEnd.value = 'Error: M, m, l oder b = 0';
            if (M_kg === 0) massMInput.classList.add('error');
            if (m_kg === 0) massmInput.classList.add('error');
            if (l_m === 0) distanceLInput.classList.add('error');
            if (b_m === 0) distanceBInput.classList.add('error');
            return;
        }

        calculatedG_end = (calculatedKappa * theta_rad * Math.pow(b_m, 2)) / (M_kg * m_kg * l_m);
        outputGEnd.value = formatNumber(calculatedG_end, 5);
        updateFormulaDisplay(formulaGEndDisplay, 'G = (κ * θ * b²) / (M * m * l) =', { κ: calculatedKappa, θ: theta_rad, b: b_m, M: M_kg, m: m_kg, l: l_m });

        calculateCorrectionFactorK(l_m, b_m);
        if (calculatedK !== null) {
             calculatedG_end_corrected = calculatedG_end * calculatedK;
             outputGEndCorrected.value = formatNumber(calculatedG_end_corrected, 5);
        }

        updateComparison();
        enableExportButtons();
        saveToHistory(true); // True = Endausschlag method
        renderHistoryTable();
    }

    function calculateCorrectionFactorK(l_m, b_m) {
        if (isNaN(l_m) || l_m <= 0 || isNaN(b_m) || b_m <= 0) { resetCorrectionFactor(); return; }

        const d_prime_sq = Math.pow(l_m, 2) + Math.pow(b_m, 2);
        if (d_prime_sq <= 0) { calculatedK = null; outputK.value = 'Error'; return; }
        const d_prime = Math.sqrt(d_prime_sq);
        const term = Math.pow(b_m / d_prime, 3);

        if (term >= 1 || isNaN(term)) { calculatedK = null; outputK.value = 'Error'; return; }

        calculatedK = 1 / (1 - term);
        outputK.value = formatNumber(calculatedK, 4);
        updateFormulaDisplay(formulaKDisplay, 'K = 1 / (1 - (b / √(l² + b²))³) =', { l: l_m, b: b_m });
    }

    function calculateG_Acceleration() {
         resetGAccelResults();
         if (calculatedKappa === null) { // Braucht auch M, l, b
            alert("Bitte zuerst I & κ in Tab 1 berechnen."); switchTabDirect('tab-daten'); return;
         }
        const isValidM = validateInput(massMInput);
        const isValidl = validateInput(distanceLInput);
        const isValidB = validateInput(distanceBInput); // b is needed!
        const isValidL0 = validateInput(distanceL0Input);
        const isValidL1 = validateInput(distanceL1Input, true, true); // Positiv, 0 erlaubt
        const isValidSlope = validateInput(slopeAccelInput, false, true); // Nicht pos., 0 erlaubt

        if (!isValidM || !isValidl || !isValidB || !isValidL0 || !isValidL1 || !isValidSlope) return;

        const M_kg = getValueInBaseUnits(massMInput, unitMSelect);
        const l_m = getValueInBaseUnits(distanceLInput, unitLSelect);
        const b_m = getValueInBaseUnits(distanceBInput, unitBSelect); // Get b value
        const L0_m = getValueInBaseUnits(distanceL0Input, unitL0Select);
        const L1_m = getValueInBaseUnits(distanceL1Input, unitL1Select);
        const slope_mps2 = getValueInBaseUnits(slopeAccelInput, unitSlopeAccelSelect);

        if (M_kg === 0 || l_m === 0 || b_m === 0) { // Check M, l, b
             outputGAccel.value = 'Error: M, l oder b = 0';
             if (M_kg === 0) massMInput.classList.add('error');
             if (l_m === 0) distanceLInput.classList.add('error');
             if (b_m === 0) distanceBInput.classList.add('error');
             return;
        }
         const L_term_sq = Math.pow(L0_m, 2) + Math.pow(L1_m, 2);
         if (L_term_sq === 0) {
             outputGAccel.value = 'Error: L0²+L1² = 0';
             distanceL0Input.classList.add('error'); distanceL1Input.classList.add('error'); return;
         }

        // Formula G = (b² * l * slope) / (4 * M * (L0² + L1²))
        calculatedG_accel = (Math.pow(b_m, 2) * l_m * slope_mps2) / (4 * M_kg * L_term_sq);
        outputGAccel.value = formatNumber(calculatedG_accel, 5);
        updateFormulaDisplay(formulaGAccelDisplay, 'G = (b² * l * Steigung) / (4 * M * (L0² + L1²)) =', {
             b: b_m, l: l_m, Steigung: slope_mps2, M: M_kg, L0: L0_m, L1: L1_m
        });

         updateComparison();
         enableExportButtons();
         saveToHistory(false); // False = Acceleration method
         renderHistoryTable();
     }

    function calculateSlopeFromData() { /* Unverändert */
         const timeInputs = slopeDataContainer.querySelectorAll('.time-input');
         const positionInputs = slopeDataContainer.querySelectorAll('.position-input');
         const unitSelects = slopeDataContainer.querySelectorAll('.unit-S');
         let points = [];
         for (let i = 0; i < timeInputs.length; i++) {
             const t_val = parseFloat(timeInputs[i].value);
             const s_raw = parseFloat(positionInputs[i].value);
             const unit = unitSelects[i].value;
             if (validateInput(timeInputs[i], true, true) && validateInput(positionInputs[i], false, true)) { // Validate inputs
                 let s_m = getValueInBaseUnits(positionInputs[i], unitSelects[i]); // Use helper
                 points.push({ t2: t_val * t_val, s: s_m });
             } else {
                 // Optional: Provide feedback about invalid points?
             }
         }
         points.sort((a, b) => a.t2 - b.t2);
         if (points.length < 2) {
             slopeResultDisplay.textContent = "Fehler: Mind. 2 gültige Datenpunkte benötigt.";
             calculatedSlope = null; slopeAccelInput.value = ''; return;
         }
         const N = points.length;
         let sum_t2 = 0, sum_s = 0, sum_t2_s = 0, sum_t2_squared = 0;
         points.forEach(p => {
             sum_t2 += p.t2; sum_s += p.s; sum_t2_s += p.t2 * p.s; sum_t2_squared += p.t2 * p.t2;
         });
         const denominator = N * sum_t2_squared - sum_t2 * sum_t2;
         if (Math.abs(denominator) < 1e-15) {
             slopeResultDisplay.textContent = "Fehler: Zeitpunkte nicht unterschiedlich genug.";
             calculatedSlope = null; slopeAccelInput.value = ''; return;
         }
         calculatedSlope = (N * sum_t2_s - sum_t2 * sum_s) / denominator;
         const interceptS1 = (sum_s - calculatedSlope * sum_t2) / N;
         slopeResultDisplay.innerHTML = `Berechnet: Steigung ≈ <code>${formatNumber(calculatedSlope, 5)} m/s²</code>, S₁(t=0) ≈ <code>${formatNumber(interceptS1, 4)} m</code>`;
         slopeAccelInput.value = calculatedSlope.toExponential(5);
         unitSlopeAccelSelect.value = 'm/s2';
         formulaDisplaySlope.innerHTML = `Aus ${N} Punkten berechnet.`;
         validateInput(slopeAccelInput, false, true); // Re-validate the input field
     }

    function berechneMittelpunktAbstand(distAfInput, dmKkInput, dmGkInput) {
          // Werte aus den Eingabefeldern abrufen und in Zahlen umwandeln
         const abstandAussenflaechen = parseFloat(distAfInput.value);
          const durchmesserKleineKugel = parseFloat(dmKkInput.value);
          const durchmesserGrosseKugel = parseFloat(dmGkInput.value);

          // Überprüfen, ob die Eingaben gültige Zahlen sind
          if (isNaN(abstandAussenflaechen) || isNaN(durchmesserKleineKugel) || isNaN(durchmesserGrosseKugel)) {
            return "Ungültige Eingabe"; // Oder eine Fehlermeldung anzeigen
          }

          // Radien der Kugeln berechnen
          const radiusKleineKugel = durchmesserKleineKugel / 2;
          const radiusGrosseKugel = durchmesserGrosseKugel / 2;

          // Abstand der Mittelpunkte berechnen
          const abstandMittelpunkte = abstandAussenflaechen + radiusKleineKugel + radiusGrosseKugel;

          return abstandMittelpunkte;
    }

        



     function addDataPointRow() { /* Unverändert */
         const dataPointDiv = document.createElement('div');
         dataPointDiv.classList.add('data-point');
         dataPointDiv.innerHTML = `
             <input type="number" class="time-input" placeholder="t (s)" step="any" min="0">
             <input type="number" class="position-input" placeholder="S (Position)" step="any">
             <select class="unit-S"> <option value="m" selected>m</option> <option value="cm">cm</option> <option value="mm">mm</option> </select>
         `;
         slopeDataContainer.insertBefore(dataPointDiv, addDataPointButton);
     }

    // --- Reset Functions ---
    function resetIntermediateResults() {
        calculatedI = null; calculatedKappa = null;
        outputI.value = ''; outputKappa.value = '';
        formulaIDisplay.innerHTML = 'Formel: I = 2 * m * (l/2)²';
        formulaKappaDisplay.innerHTML = 'Formel: κ = (4 * π² * I) / T²';
        calculateGEndButton.disabled = true; calculateGAccelButton.disabled = true;
    }
    function resetGEndResults() {
        calculatedG_end = null; calculatedG_end_corrected = null;
        outputGEnd.value = ''; outputGEndCorrected.value = '';
        formulaGEndDisplay.innerHTML = 'Formel: G = (κ * θ * b²) / (M * m * l)';
        resetComparison(); disableExportButtons();
    }
    function resetGAccelResults() {
        calculatedG_accel = null; outputGAccel.value = '';
        formulaGAccelDisplay.innerHTML = 'Formel: G = (b² * l * Steigung) / (4 * M * (L0² + L1²))';
        resetComparison(); disableExportButtons();
    }
    function resetCorrectionFactor() {
        calculatedK = null; outputK.value = ''; outputGEndCorrected.value = ''; // Reset corrected G too
        formulaKDisplay.innerHTML = 'Formel: K = 1 / (1 - (b / √(l² + b²))³)';
    }
    function resetComparison() { /* Unverändert */
        yourGResultEndDisplay.textContent = '-'; gDeviationEndDisplay.textContent = '-';
        yourGResultAccelDisplay.textContent = '-'; gDeviationAccelDisplay.textContent = '-';
    }

    // --- Comparison, History, Export ---
    function updateComparison() { /* Unverändert */
         if (calculatedG_end_corrected !== null && !isNaN(calculatedG_end_corrected)) {
             yourGResultEndDisplay.textContent = formatNumber(calculatedG_end_corrected, 5) + " N⋅m²/kg²";
             const deviation = ((calculatedG_end_corrected - STANDARD_G) / STANDARD_G) * 100;
             gDeviationEndDisplay.textContent = formatNumber(deviation, 2) + " %";
         } else { yourGResultEndDisplay.textContent = '-'; gDeviationEndDisplay.textContent = '-'; }
         if (calculatedG_accel !== null && !isNaN(calculatedG_accel)) {
             yourGResultAccelDisplay.textContent = formatNumber(calculatedG_accel, 5) + " N⋅m²/kg²";
             const deviation = ((calculatedG_accel - STANDARD_G) / STANDARD_G) * 100;
             gDeviationAccelDisplay.textContent = formatNumber(deviation, 2) + " %";
         } else { yourGResultAccelDisplay.textContent = '-'; gDeviationAccelDisplay.textContent = '-'; }
    }
    function saveToHistory(isEndausschlagMethod) { /* Unverändert */
         const M_kg = getValueInBaseUnits(massMInput, unitMSelect);
         const m_kg = getValueInBaseUnits(massmInput, unitmSelect);
         const l_m = getValueInBaseUnits(distanceLInput, unitLSelect);
         const T_s = getValueInBaseUnits(periodTInput, {value: 's'});
         const b_m = getValueInBaseUnits(distanceBInput, unitBSelect);
         const theta_rad = getValueInBaseUnits(angleThetaInput, unitThetaSelect);
         const L0_m = getValueInBaseUnits(distanceL0Input, unitL0Select);
         const L1_m = getValueInBaseUnits(distanceL1Input, unitL1Select);
         const slope_mps2 = getValueInBaseUnits(slopeAccelInput, unitSlopeAccelSelect);
         const entry = {
             timestamp: new Date().toISOString(), method: isEndausschlagMethod ? "Endausschlag" : "Beschleunigung",
             inputs: { M: M_kg, m: m_kg, l: l_m, T: T_s, b: b_m, theta: theta_rad, L0: L0_m, L1: L1_m, slope: slope_mps2 },
             results: { I: calculatedI, kappa: calculatedKappa, G_end: calculatedG_end, K: calculatedK, G_end_corr: calculatedG_end_corrected, G_accel: calculatedG_accel, G_final: isEndausschlagMethod ? calculatedG_end_corrected : calculatedG_accel }
         };
         history.unshift(entry); if (history.length > 10) history.pop();
         localStorage.setItem('cavendishHistory', JSON.stringify(history));
    }
     function renderHistoryTable() { /* Unverändert */
         if (history.length === 0) { historyTableContainer.innerHTML = '<p>Noch keine Berechnungen gespeichert.</p>'; clearHistoryButton.style.display = 'none'; return; }
         let tableHTML = `<table><thead><tr><th>Zeit</th><th>Methode</th><th>G (Resultat)</th><th>M</th><th>m</th><th>l</th><th>T</th><th>b</th><th>θ/Steig.</th></tr></thead><tbody>`;
         history.forEach(entry => {
            const displayValue = entry.method === "Endausschlag" ? formatNumber(entry.results.G_end_corr, 5) : formatNumber(entry.results.G_accel, 5);
            const secondParam = entry.method === "Endausschlag" ? formatNumber(entry.inputs.theta, 4) + ' rad' : formatNumber(entry.inputs.slope, 3) + ' m/s²';
            tableHTML += `<tr><td>${new Date(entry.timestamp).toLocaleTimeString('de-DE')}</td><td>${entry.method}</td><td>${displayValue}</td><td>${formatNumber(entry.inputs.M, 3)}</td><td>${formatNumber(entry.inputs.m, 3)}</td><td>${formatNumber(entry.inputs.l, 3)}</td><td>${formatNumber(entry.inputs.T, 1)}</td><td>${formatNumber(entry.inputs.b, 3)}</td><td>${secondParam}</td></tr>`;
         });
         tableHTML += '</tbody></table>'; historyTableContainer.innerHTML = tableHTML; clearHistoryButton.style.display = 'inline-block';
     }
     function clearHistory() { /* Unverändert */
         if (confirm("Möchten Sie den gesamten Berechnungsverlauf wirklich löschen?")) {
            history = []; localStorage.removeItem('cavendishHistory'); renderHistoryTable();
         }
     }
     function enableExportButtons() { exportCsvButton.disabled = false; exportPdfButton.disabled = false; }
     function disableExportButtons() { exportCsvButton.disabled = true; exportPdfButton.disabled = true; }
     function getCurrentDataForExport() { /* Unverändert, enthält jetzt alle relevanten Felder */
         const M_kg = getValueInBaseUnits(massMInput, unitMSelect);
         const m_kg = getValueInBaseUnits(massmInput, unitmSelect);
         const l_m = getValueInBaseUnits(distanceLInput, unitLSelect);
         const T_s = getValueInBaseUnits(periodTInput, {value: 's'});
         const b_m = getValueInBaseUnits(distanceBInput, unitBSelect);
         const theta_rad = getValueInBaseUnits(angleThetaInput, unitThetaSelect);
         const L0_m = getValueInBaseUnits(distanceL0Input, unitL0Select);
         const L1_m = getValueInBaseUnits(distanceL1Input, unitL1Select);
         const slope_mps2 = getValueInBaseUnits(slopeAccelInput, unitSlopeAccelSelect);
         const inputs = [
                 { Parameter: "M (große Kugeln)", Value: formatNumber(M_kg, 5), Unit: "kg" }, { Parameter: "m (kleine Kugeln)", Value: formatNumber(m_kg, 5), Unit: "kg" },
                 { Parameter: "l (Gesamtabstand m-m)", Value: formatNumber(l_m, 5), Unit: "m" }, { Parameter: "T (Periode)", Value: formatNumber(T_s, 5), Unit: "s" },
                 { Parameter: "b (Abstand M-m)", Value: formatNumber(b_m, 5), Unit: "m" }, { Parameter: "θ (Winkel Endausschl.)", Value: formatNumber(theta_rad, 5), Unit: "rad" },
                 { Parameter: "L0 (Abstand Pendel-Skala)", Value: formatNumber(L0_m, 5), Unit: "m" }, { Parameter: "L1 (Versatz Skala)", Value: formatNumber(L1_m, 5), Unit: "m" },
                 { Parameter: "Steigung (ΔS/Δt²)", Value: formatNumber(slope_mps2, 5), Unit: "m/s²" },
         ];
         const results = [
                 { Parameter: "I (Trägheitsmoment)", Value: formatNumber(calculatedI), Unit: "kg⋅m²" }, { Parameter: "κ (Torsionskonstante)", Value: formatNumber(calculatedKappa), Unit: "N⋅m/rad" },
                 { Parameter: "G (Endausschl., unkorr.)", Value: formatNumber(calculatedG_end, 5), Unit: "N⋅m²/kg²" }, { Parameter: "K (Korrekturfaktor)", Value: formatNumber(calculatedK, 4), Unit: "" },
                 { Parameter: "G (Endausschl., korr.)", Value: formatNumber(calculatedG_end_corrected, 5), Unit: "N⋅m²/kg²" }, { Parameter: "G (Beschleunigung)", Value: formatNumber(calculatedG_accel, 5), Unit: "N⋅m²/kg²" }
         ];
         const comparison = [
                  { Parameter: "Standard G", Value: STANDARD_G.toExponential(5), Unit: "N⋅m²/kg²" },
                  { Parameter: "Abw. G (End., korr.)", Value: (calculatedG_end_corrected !== null && !isNaN(calculatedG_end_corrected)) ? formatNumber(((calculatedG_end_corrected - STANDARD_G) / STANDARD_G) * 100, 2) : '-', Unit: "%" },
                  { Parameter: "Abw. G (Beschl.)", Value: (calculatedG_accel !== null && !isNaN(calculatedG_accel)) ? formatNumber(((calculatedG_accel - STANDARD_G) / STANDARD_G) * 100, 2) : '-', Unit: "%" }
         ];
         return { inputs, results, comparison };
     }
     function exportToCSV() { /* Unverändert */
         if (calculatedG_end === null && calculatedG_accel === null) return;
         const data = getCurrentDataForExport(); let csvContent = "Typ,Parameter,Wert,Einheit\n";
         data.inputs.forEach(row => { csvContent += `Eingabe,"${row.Parameter}",${row.Value},"${row.Unit}"\n`; });
         data.results.forEach(row => { csvContent += `Ergebnis,"${row.Parameter}",${row.Value},"${row.Unit}"\n`; });
         data.comparison.forEach(row => { csvContent += `Vergleich,"${row.Parameter}",${row.Value},"${row.Unit}"\n`; });
         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a");
         if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", "cavendish_berechnung.csv"); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
    }
    function exportToPDF() { /* Unverändert */
         if ((calculatedG_end === null && calculatedG_accel === null) || typeof jsPDF === 'undefined' || typeof autoTable === 'undefined') { alert("PDF Export nicht möglich (keine Ergebnisse oder Bibliotheken fehlen)."); return; }
         const { jsPDF } = window.jspdf; const doc = new jsPDF(); const data = getCurrentDataForExport(); const tableStartY = 20;
         doc.setFontSize(18); doc.text("Cavendish Experiment - Ergebnisse", 14, 15);
         doc.setFontSize(12); doc.text("Eingabeparameter:", 14, tableStartY + 5);
         doc.autoTable({ startY: tableStartY + 8, head: [['Parameter', 'Wert', 'Einheit']], body: data.inputs.map(row => [row.Parameter, row.Value, row.Unit]), theme: 'grid', headStyles: { fillColor: [0, 123, 255] }, styles: { fontSize: 9 } });
         let currentY = doc.lastAutoTable.finalY + 10; doc.text("Berechnete Ergebnisse:", 14, currentY);
         doc.autoTable({ startY: currentY + 3, head: [['Parameter', 'Wert', 'Einheit']], body: data.results.map(row => [row.Parameter, row.Value, row.Unit]), theme: 'grid', headStyles: { fillColor: [0, 123, 255] }, styles: { fontSize: 9 } });
         currentY = doc.lastAutoTable.finalY + 10; doc.text("Vergleich:", 14, currentY);
         doc.autoTable({ startY: currentY + 3, head: [['Parameter', 'Wert', 'Einheit']], body: data.comparison.map(row => [row.Parameter, row.Value, row.Unit]), theme: 'grid', headStyles: { fillColor: [0, 123, 255] }, styles: { fontSize: 9 } });
         doc.save("cavendish_berechnung.pdf");
    }

    // --- UI Functions ---
     function switchTab(event) { /* Unverändert */
        const targetTab = event.target.dataset.tab; switchTabDirect(targetTab);
     }
     function switchTabDirect(tabId) { /* Unverändert */
        tabs.forEach(tab => tab.classList.remove('active')); tabContents.forEach(content => content.classList.remove('active'));
        const targetButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`); const targetContent = document.getElementById(tabId);
        if(targetButton && targetContent) { targetButton.classList.add('active'); targetContent.classList.add('active'); }
     }
     function toggleDarkMode() { /* Unverändert */
        document.body.classList.toggle('dark-mode'); const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        darkModeToggle.textContent = isDarkMode ? '☀️' : '🌓'; darkModeToggle.title = isDarkMode ? 'Lichtmodus umschalten' : 'Dunkelmodus umschalten';
     }
     function applyDarkModePreference() { /* Unverändert */
        const savedMode = localStorage.getItem('darkMode'); if (savedMode === 'enabled') { document.body.classList.add('dark-mode'); darkModeToggle.textContent = '☀️'; darkModeToggle.title = 'Lichtmodus umschalten'; } else { document.body.classList.remove('dark-mode'); darkModeToggle.textContent = '🌓'; darkModeToggle.title = 'Dunkelmodus umschalten'; }
     }

    // --- Event Listeners ---
    tabs.forEach(tab => tab.addEventListener('click', switchTab));
    darkModeToggle.addEventListener('click', toggleDarkMode);
    calculateDatenButton.addEventListener('click', calculateIntermediateData);
    calculateGEndButton.addEventListener('click', calculateG_Endausschlag);
    calculateGAccelButton.addEventListener('click', calculateG_Acceleration);
    addDataPointButton.addEventListener('click', addDataPointRow);
    calculateSlopeButton.addEventListener('click', calculateSlopeFromData);
    exportCsvButton.addEventListener('click', exportToCSV);
    exportPdfButton.addEventListener('click', exportToPDF);
    clearHistoryButton.addEventListener('click', clearHistory);

    // Input change listeners (vereinfachte Reset-Logik)
    const allInputs = document.querySelectorAll('.tab-content input[type="number"], .tab-content select');
    allInputs.forEach(input => {
        const listener = () => {
            const parentTabId = input.closest('.tab-content')?.id;
            // Validieren bei Eingabe
            if(input.type === 'number') {
                 validateInput(input, input.min !== null && parseFloat(input.min) >= 0, input.min !== null && parseFloat(input.min) === 0);
            }
            // Reset basierend auf Tab/Input ID
            if (parentTabId === 'tab-daten') {
                 resetIntermediateResults(); resetGEndResults(); resetGAccelResults(); resetCorrectionFactor();
            } else if (parentTabId === 'tab-berechnung-end') {
                 resetGEndResults(); resetCorrectionFactor(); resetGAccelResults(); // G_accel braucht b
            } else if (parentTabId === 'tab-ergebnis') {
                 if(input.id.startsWith('distance-L') || input.id.startsWith('unit-L') || input.id.startsWith('slope') || input.id.startsWith('unit-slope')){
                    resetGAccelResults();
                 }
                 // Wenn b (in Tab 2) geändert wird, K und G_accel auch zurücksetzen
                 if(input.id === 'distance-b' || input.id === 'unit-b') { // Check IDs from Tab 2
                     resetCorrectionFactor();
                     resetGAccelResults();
                 }
            }
            resetComparison();
            disableExportButtons();
        };
        input.addEventListener('input', listener);
        if(input.tagName === 'SELECT'){
             input.addEventListener('change', listener); // Auch bei Auswahländerung
        }
    });

    // --- Initial Setup ---
    applyDarkModePreference();
    renderHistoryTable();
    disableExportButtons();
    calculateGEndButton.disabled = true;
    calculateGAccelButton.disabled = true;
    updateDatenVisualization(NaN);
    updateForcesVisualization(NaN);

}); // End DOMContentLoaded
