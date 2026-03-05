
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.action === "sayHey") {
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
    return stockMap;
}
function getCompanyname(){
    var companyName = document.getElementsByClassName("typography-primary text-[24px] font-extrabold")
    return companyName[0].innerHTML.trim()
    
}

function analyzeStockData(stockMap) {
    const parse = (key) => {
        let val = stockMap.get(key);
        if (!val || val === '-' || /n\/a/i.test(val)) return null;
        let clean = val.replace(/[^\d,.-]/g, '').replace(',', '.');
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

    const report = [];
    const insights = [];
    const clamp = (val) => Math.max(0, Math.min(100, val));

    const addMetric = (name, score) => {
        report.push({ name, score: score.toFixed(1) });
    };

    
    let qualityScore = 0;
    let qualityWeight = 0;
    if (data.ebit !== null && data.rev !== null && data.rev > 0) {
        const ebitMargin = (data.ebit / data.rev) * 100;
        insights.push(`EBIT Margin is ${ebitMargin.toFixed(2)}%`);
        
        qualityScore = (ebitMargin < 5) ? 20 : (ebitMargin > 20) ? 100 : (ebitMargin - 5) * 5.33 + 20;
        qualityScore = clamp(qualityScore);
        qualityWeight = 0.4;
        addMetric('Operating Margin (EBIT)', qualityScore);
    } else {
        insights.push(`EBIT Margin: Data unavailable`);
    }

    let valScore = 0;
    let valWeight = 0;
    if (data.pe !== null && data.ps !== null) {
        const peScore = clamp(100 - (data.pe * 2)); 
        const psScore = clamp(100 - (data.ps * 12));
        valScore = clamp((peScore + psScore) / 2);
        valWeight = 0.3;
        addMetric('Valuation Multiples', valScore);
    }

    let pegScore = 0;
    let growthWeight = 0;
    if (data.peg !== null) {
        pegScore = clamp(100 - ((data.peg - 0.5) * 40));
        growthWeight = 0.2;
        addMetric('PEG (Growth/Price)', pegScore);
    }

    let divScore = 0;
    let divWeight = 0;
    if (data.dps !== null && data.eps !== null && data.eps > 0) {
        const payout = (data.dps / data.eps) * 100;
        insights.push(`Payout Ratio is ${payout.toFixed(2)}%`);
        
        divScore = (payout > 90) ? 10 : (payout < 10) ? 50 : 100;
        divScore = clamp(divScore);
        divWeight = 0.1;
        addMetric('Dividend Safety', divScore);
    } else {
        insights.push(`Payout Ratio: Data unavailable or no dividend`);
    }

    if (data.owners !== null) {
         insights.push(`Retail Popularity: ${data.owners.toLocaleString('da-DK')} owners`);
    }
    const totalWeight = qualityWeight + valWeight + growthWeight + divWeight;
    let finalScore = 50; 
    
    if (totalWeight > 0) {
        finalScore = ((qualityScore * qualityWeight) + 
                      (valScore * valWeight) + 
                      (pegScore * growthWeight) + 
                      (divScore * divWeight)) / totalWeight;
    }
    const date = Date();
    var aktieværdi = document.getElementsByClassName("Typography__Span-sc-10mju41-0 iwRMOt Typography__StyledTypography-sc-10mju41-1 jSSNDr InstrumentPrice-styles__CurrentPriceTypography-sc-565cab2c-0 kwOCUd")[0].textContent
    return {
        score: finalScore.toFixed(2),
        status: finalScore > 70 ? 'Strong Buy' : finalScore > 45 ? 'Hold' : 'Avoid',
        metrics: report,
        markedværdi: stockMap.get("Markedsværdi"), 
        insights: insights,
        stats: 
        [
            {date: date},
            {aktieværdi: aktieværdi }
        ],
        companyName: getCompanyname()
    };
}