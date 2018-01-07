const http = require('http');
const rollbar = require('lambda-rollbar')({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN
});
const sandwichRegex = /size="5">\* ([^<]+)<\/font/g;

function fetchNourishInfo(callback) {
  let response_body = [];
  http.get('http://www.nourishkelowna.com/today-s-choices', (res) => {
    res.on('data', (body) => {
      response_body.push(body);
    }).on('end', () => {
      response_body = Buffer.concat(response_body).toString();
      callback(null, response_body)
    });
  });
}

function extractSandwichList(inputText) {
  let sandwichText = inputText.match(/Sandwich.+bread/);
  console.log(sandwichText[0]);
  let sandwichList = [];
  let cap;
  while (cap = sandwichRegex.exec(sandwichText[0])) {
    sandwichList.push(cap[1].replace('&amp;', ''))
  }
  return sandwichList;
}

module.exports.nourishGet = rollbar.wrap((event, context, callback, rb) => {
  console.log('Starting request.');
  fetchNourishInfo((err, body) => {
    if (err) {
      console.log(err);
      rb.error(err);
    } else {
      let response = {
        statusCode: 200,
        body: JSON.stringify({
          sandwiches: extractSandwichList(body)
        })
      };
      callback(null, response)
    }
  });
});
