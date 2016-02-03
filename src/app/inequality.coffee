class Symbol
  constructor: (@x, @y, @symbol) ->

  draw: (p) ->
    p.ellipse(@x, @y, 25, 25)



symbols = []

myp = new p5 (p)->
  p.setup = ->
    p.createCanvas(800, 600)
    for i in [0..11] by 1
      symbols.push(new Symbol(100 + 100*(i%4), 100 + 100*(i/4), "e"))

  p.draw = ->
    p.ellipse(50, 50, 50, 25)
    for symbol in symbols
      symbol.draw(p)
