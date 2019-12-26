"use strict";

const fs1 = require("fs"), fs2 = require("fs");
const https = require("https");
const o = require("./tickers.json");

var l = o.tickers.length, results = [];


function analyzeTicker(i)
{
  if (i<l)
  {
    process.stdout.write("Progress: " + (i+1) + "/" + l + "\r");
    queryYahooFinance(i, function(ss) {
      try 
      {
        const obj = JSON.parse(ss);
        if (obj.quoteSummary.error === null && typeof obj.quoteSummary.result[0].recommendationTrend != "undefined")
        {
          var rating = 2 * (obj.quoteSummary.result[0].recommendationTrend.trend[0].strongBuy - obj.quoteSummary.result[0].recommendationTrend.trend[1].strongBuy) 
          + (obj.quoteSummary.result[0].recommendationTrend.trend[0].buy - obj.quoteSummary.result[0].recommendationTrend.trend[1].buy) 
          - (obj.quoteSummary.result[0].recommendationTrend.trend[0].sell - obj.quoteSummary.result[0].recommendationTrend.trend[1].sell) 
          - 2 * (obj.quoteSummary.result[0].recommendationTrend.trend[0].strongSell - obj.quoteSummary.result[0].recommendationTrend.trend[1].strongSell);
          
          if (rating > 14)
          {
            results.push({"ticker": o.tickers[i], "rating": rating});  // save only results with ratings that are high enough 
          }
        }
      }
      catch (err)
      {
        fs2.appendFileSync('errorlog.txt', err.message + '\r\n');
      }
      
      analyzeTicker(++i);
    });
  }
  else
  {
    // show results
    results.sort(function(a, b) { return b.rating - a.rating; });  // sort desc
    fs1.writeFileSync('results.txt', 'Ticker Rating\r\n');
    results.forEach(function(a) { fs1.appendFileSync('results.txt', a.ticker + '  ' + a.rating + '\r\n'); });
    // fs1.writeFileSync('results.json', JSON.stringify(results));
  }
}

function queryYahooFinance(i, callback)
{
    var request = https.request({ host: 'query1.finance.yahoo.com',  path: '/v10/finance/quoteSummary/'+o.tickers[i]+'?formatted=true&modules=recommendationTrend%2CsummaryDetail', method: 'GET' }, function(response) {
      var body = "";
      response.on("data", function(chunk) { body += chunk.toString("utf8"); });
      response.on("end", function() { callback(body); }); 
      response.on("error", function(error) { fs2.appendFileSync('errorlog.txt', error.stack + '\r\n'); });
    });
    request.end();      
}


analyzeTicker(0);

