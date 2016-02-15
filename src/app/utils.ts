///////// UTILS.TS

export function iRange(from: number, to: number, includeLast: boolean = true) {
    var j: number = includeLast ? to+1 : to;
    return Array.apply(null, Array(j - from)).map(function(_, i) { return i; });
}

export function saneRound(n: number, dp: number = 0) {
    var p = Math.pow(10, dp);
    return Math.round(n * p) / p;
}