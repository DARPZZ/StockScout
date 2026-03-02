document.getElementById("fetchBtn").addEventListener("click", () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "sayHey"}, (response) => {
            if (response && response.data) {
                renderAnalysis(response.data);
            }
        });
    });
});

function renderAnalysis(analysis) {
    const scoreCard = document.getElementById('score-card');
    if (!scoreCard) return;
    console.log(analysis)
    scoreCard.classList.remove('hidden');
    const scoreVal = Math.round(parseFloat(analysis.score));
    
    updateText('score-value', scoreVal.toString());
    updateText('status-badge', analysis.status);
    updateText('mcap-text', analysis.markedværdi);
    const breakdown = analysis.breakdown || {};
    
    updateText('profitability-score', `${Math.round(analysis.metrics.find(m => m.name === 'Operating Margin (EBIT)')?.score || 0)}%`);
    updateText('growth-score', `${Math.round(analysis.metrics.find(m => m.name === 'PEG (Growth/Price)')?.score || 0)}%`);
    updateText('financial-score', `${Math.round(analysis.metrics.find(m => m.name === 'Dividend Safety')?.score || 0)}%`);
    updateText('valuation-score', `${Math.round(analysis.metrics.find(m => m.name === 'Valuation Multiples')?.score || 0)}%`);

    const flagsContainer = document.getElementById('flags');
    if (flagsContainer) {
        flagsContainer.innerHTML = ''; 
        if (analysis.flags && analysis.flags.length > 0) {
            analysis.flags.forEach(flag => {
                const div = document.createElement('div');
                div.className = "bg-rose-50 text-rose-600 text-[10px] px-3 py-2 rounded-lg border border-rose-100 font-bold flex items-center";
                div.innerHTML = `⚠️ <span class="ml-2">${flag}</span>`;
                flagsContainer.appendChild(div);
            });
        }
    }

    const scoreBox = document.getElementById('score-box');
    if (scoreBox) {
        const colorClass = scoreVal >= 70 ? 'bg-emerald-500' : scoreVal >= 45 ? 'bg-amber-500' : 'bg-rose-500';
        scoreBox.className = `w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-inner mb-3 transition-all ${colorClass}`;
    }
}
function updateText(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = text;
    } else {
        console.warn(`Element with ID "${id}" not found in the DOM.`);
    }
}