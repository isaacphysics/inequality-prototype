module.exports = class coffeeTest
  constructor: (@message) ->
  go: (count) ->
    console.log 'go'
    out = ""
    for i in [1..count]
      out += "#{@message} #{i}! "
    return out

app = new coffeeTest("This message");

console.log(app.go(10));
