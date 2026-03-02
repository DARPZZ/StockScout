
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.action === "sayHey") {
        console.log(analyzeStockData(getdata()));   
        sendResponse({status: "done", data: analyzeStockData(getdata())});
    }
});
function getdata(){
    const divv = document.getElementsByClassName('DataCard-styled__TextContainer-sc-6e657361-1 eCjOmd')
    var stockMap = new Map();
    Array.from(divv).forEach(element => {
        var name = element.children[0].innerHTML;
        var attr = element.children[1].innerHTML
        stockMap.set(name,attr)
    });
    console.log(stockMap)
    return stockMap;
}

function analyzeStockData(stockMap) {
   const parse = (key) => {
    let val = stockMap.get(key);
    if (!val || val === '-' || /n\/a/i.test(val)) return null;
    let clean = val.replace(/[a-z.% \s]/gi, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
};

    const data = {
        mcap: parse('Markedsværdi'),
        rev: parse('Omsætning'),
        ebit: parse('EBIT'),
        eps: parse('EPS'),
        dps: parse('DPS'),
        yield: parse('Direkte afkast'),
        pe: parse('P/E'),
        pb: parse('P/B'),
        peg: parse('PEG'),
        ps: parse('P/S'),
        owners: parse('Ejere hos Nordnet*')
    };

    const ebitMargin = (data.ebit / data.rev) * 100;
    const payout = (data.dps / data.eps) * 100;

    const report = [];

    const addMetric = (name, score) => {
        report.push({ name, score: Math.max(0, Math.min(100, score)).toFixed(1) });
    };

    const qualityScore = (ebitMargin < 5) ? 20 : (ebitMargin > 20) ? 100 : (ebitMargin - 5) * 5.33 + 20;
    addMetric('Operating Margin (EBIT)', qualityScore);
    const peScore = 100 - (data.pe * 2); 
    const psScore = 100 - (data.ps * 12);
    addMetric('Valuation Multiples', (peScore + psScore) / 2);
    const pegScore = 100 - ((data.peg - 0.5) * 40);
    addMetric('PEG (Growth/Price)', pegScore);

    const dividendScore = (payout > 90) ? 10 : (payout < 10) ? 50 : 100;
    addMetric('Dividend Safety', dividendScore);

    const weights = { quality: 0.4, valuation: 0.3, growth: 0.2, div: 0.1 };
    const finalScore = (qualityScore * weights.quality) + 
                       (((peScore + psScore) / 2) * weights.valuation) + 
                       (pegScore * weights.growth) + 
                       (dividendScore * weights.div);

    return {
        score: finalScore.toFixed(2),
        status: finalScore > 70 ? 'Strong Buy' : finalScore > 45 ? 'Hold' : 'Avoid',
        metrics: report,
        markedværdi: stockMap.get("Omsætning"),
        insights: [
            `EBIT Margin is ${ebitMargin.toFixed(2)}%`,
            `Payout Ratio is ${payout.toFixed(2)}%`,
            `Retail Popularity: ${data.owners.toLocaleString()} owners`
        ]
    };
}